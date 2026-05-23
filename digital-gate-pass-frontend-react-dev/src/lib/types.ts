export type Role = "STUDENT" | "WARDEN" | "SECURITY" | "ADMIN";

export interface User {
  id: string;
  userId?: string | number;
  email: string;
  fullName?: string;
  phone?: string;
  enrollmentNo?: string;
  hostel?: string;
  roomNo?: string;
  department?: string;
  course?: string;
  semester?: number;
  studentMobile?: string;
  parentMobile?: string;
  roles: Role[];
}

export type PassStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "USED"
  | "RETURNED"
  | "EXPIRED";

export type PassType = "DAY" | "NIGHT" | "EMERGENCY" | "MEDICAL" | "HOME";

export interface GatePass {
  id: number;
  studentId: number;
  studentName: string;
  reason: string;
  destination: string;
  passType: PassType;
  leaveAt: string;
  returnBy: string;
  status: PassStatus;
  qrToken?: string | null;
  wardenId?: number | null;
  decisionNote?: string | null;
  usedAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version?: number;
  // Student snapshot fields submitted with the pass request
  department?: string;
  course?: string;
  semester?: number;
  studentMobile?: string;
  parentMobile?: string;
  // Extended student identity fields (available when backend provides them)
  studentEmail?: string | null;
  enrollmentNo?: string | null;
  roomNo?: string | null;
}

export interface ApprovalLog {
  id: number;
  passId?: number;
  actorId: number;
  action: string;
  fromStatus: PassStatus;
  toStatus: PassStatus;
  note?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardStats {
  totalPasses: number;
  pendingCount: number;
  approvedToday: number;
  currentlyOut: number;
  expiredToday: number;
}

export interface QrCodeResponse {
  passId: number;
  qrToken: string;
  imageBase64: string;
  scanUrl: string;
}
