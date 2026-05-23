// Lightweight fetch client with auth + refresh token handling.
import type { Role, User } from "./types";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

const ACCESS_KEY = "gp_access";
const REFRESH_KEY = "gp_refresh";
const USER_KEY = "gp_user";

export function normalizeUser(value: Partial<User> | null | undefined): User | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const id = v.id ?? v.userId ?? "";
  const email = typeof v.email === "string" ? v.email : "";
  if (!email && !id) return null;
  return {
    id: String(id),
    userId: v.userId as string | number | undefined,
    email: String(email),
    fullName: typeof v.fullName === "string" ? v.fullName : undefined,
    phone: typeof v.phone === "string" ? v.phone : undefined,
    enrollmentNo: typeof v.enrollmentNo === "string" ? v.enrollmentNo : undefined,
    hostel: typeof v.hostel === "string" ? v.hostel : undefined,
    roomNo: typeof v.roomNo === "string" ? v.roomNo : undefined,
    roles: Array.isArray(v.roles) ? (v.roles as Role[]) : [],
  };
}

function parseStoredUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    return normalizeUser(JSON.parse(raw) as Partial<User> | null);
  } catch {
    return null;
  }
}

export const tokenStore = {
  getAccess: () => (typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const user = parseStoredUser(localStorage.getItem(USER_KEY));
    if (!user) localStorage.removeItem(USER_KEY);
    return user;
  },
  set: (access: string, refresh: string, user: User) => {
    const safeUser = normalizeUser(user);
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    if (safeUser) localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  },
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function refreshTokens(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  raw?: boolean; // return raw Response (for blob/png)
  query?: Record<string, string | number | undefined>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, raw = false, query } = opts;
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = tokenStore.getAccess();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401 && auth) {
    const ok = await refreshTokens();
    if (ok) res = await doFetch();
    else {
      tokenStore.clear();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:logout"));
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      // Backend standard error shape: { timestamp, status, error: "..." }
      msg = err.error || err.message || msg;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }

  if (raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const API_URL = API_BASE;
