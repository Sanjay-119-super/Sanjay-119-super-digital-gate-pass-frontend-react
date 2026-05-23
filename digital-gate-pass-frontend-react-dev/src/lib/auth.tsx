import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, tokenStore } from "./api";
import type { Role, User } from "./types";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: Partial<User>;
  userId?: number | string;
  email?: string;
  fullName?: string;
  roles?: Role[];
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<{ message: string }>;
  logout: () => void;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  enrollmentNo?: string;
  hostel?: string;
  roomNo?: string;
  department: string;
  course: string;
  semester: number;
  studentMobile?: string;
  parentMobile?: string;
  roles: Role[];
}

export function defaultRouteForUser(user: User): string {
  const roles = user.roles ?? [];
  if (roles.includes("ADMIN")) return "/admin/";
  if (roles.includes("WARDEN")) return "/warden/";
  if (roles.includes("SECURITY")) return "/security/";
  return "/student/";
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const p = decodeJwt(token);
  if (!p?.exp) return true;
  return (p.exp as number) * 1000 < Date.now() + 10_000;
}

function userFromLoginRes(res: LoginResponse): User | null {
  if (res.user && res.user.email) {
    return {
      id: String(res.user.id ?? res.user.userId ?? ""),
      email: res.user.email,
      fullName: res.user.fullName,
      roles: res.user.roles ?? [],
      enrollmentNo: res.user.enrollmentNo,
      hostel: res.user.hostel,
      roomNo: res.user.roomNo,
      department: res.user.department,
      course: res.user.course,
      semester: res.user.semester,
      studentMobile: res.user.studentMobile,
      parentMobile: res.user.parentMobile,
    };
  }
  if (res.userId && res.email) {
    return {
      id: String(res.userId),
      email: res.email,
      fullName: res.fullName,
      roles: res.roles ?? [],
    };
  }
  const p = decodeJwt(res.accessToken);
  if (!p) return null;
  const roles = (p.roles as Role[]) ?? (p.role ? [p.role as Role] : ["STUDENT"]);
  return {
    id: String(p.userId ?? p.sub_id ?? ""),
    email: String(p.sub ?? p.email ?? ""),
    fullName: String(p.fullName ?? ""),
    roles,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    if (mountedRef.current) setUser(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const access = tokenStore.getAccess();
    const refresh = tokenStore.getRefresh();

    if (!access && !refresh) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        if (access && !isExpired(access)) {
          try {
            const me = await api<User>("/api/auth/me");
            if (mountedRef.current) setUser(me);
            return;
          } catch (e) {
            if (!(e instanceof ApiError && e.status === 401)) {
              const p = decodeJwt(access);
              if (p && mountedRef.current) {
                const roles = (p.roles as Role[]) ?? ["STUDENT"];
                setUser({
                  id: String(p.userId ?? ""),
                  email: String(p.sub ?? ""),
                  fullName: String(p.fullName ?? ""),
                  roles,
                });
                return;
              }
            }
          }
        }

        if (refresh) {
          const res = await api<LoginResponse>("/api/auth/refresh", {
            method: "POST",
            body: { refreshToken: refresh },
          });
          tokenStore.setAccess(res.accessToken);
          if (res.refreshToken) tokenStore.setRefresh(res.refreshToken);
          try {
            const me = await api<User>("/api/auth/me");
            if (mountedRef.current) setUser(me);
          } catch {
            const u = userFromLoginRes(res);
            if (u && mountedRef.current) setUser(u);
          }
          return;
        }

        tokenStore.clear();
      } catch {
        tokenStore.clear();
        if (mountedRef.current) setUser(null);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    void init();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [logout]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    tokenStore.setAccess(res.accessToken);
    if (res.refreshToken) tokenStore.setRefresh(res.refreshToken);
    let u: User | null = null;
    try {
      u = await api<User>("/api/auth/me");
    } catch {
      u = userFromLoginRes(res);
    }
    if (!u) throw new Error("Login succeeded but could not load user profile");
    setUser(u);
    return u;
  };

  const register = (payload: RegisterPayload) =>
    api<{ message: string }>("/api/auth/register", { method: "POST", body: payload });

  const verifyEmail = (email: string, otp: string) =>
    api("/api/auth/verify-email", { method: "POST", body: { email, otp } }) as Promise<void>;

  const forgotPassword = (email: string) =>
    api("/api/auth/forgot-password", { method: "POST", body: { email } }) as Promise<void>;

  const resetPassword = (token: string, newPassword: string) =>
    api("/api/auth/reset-password", { method: "POST", body: { token, newPassword } }) as Promise<void>;

  const hasRole = (role: Role) => !!user?.roles?.includes(role);
  const hasAnyRole = (roles: Role[]) => !!user?.roles?.some((r) => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{
        user, loading, login, register, logout,
        verifyEmail, forgotPassword, resetPassword,
        hasRole, hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be called inside <AuthProvider>");
  return ctx;
}
