export type AccountStatus = "pending" | "active" | "suspended";

export type UserRole = "owner" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  suspendReason?: string;
  createdAt: string;
  updatedAt: string;
}
