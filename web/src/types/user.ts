import type { ModulePreset, OwnerModules } from "./entitlements";

export type AccountStatus = "pending" | "active" | "suspended";

export type UserRole = "owner" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  /** Per-owner module access. Always populated by the mappers (defaults to `core`). */
  modules: OwnerModules;
  /** Preset the flags currently match, or "custom". */
  modulePreset: ModulePreset;
  modulesUpdatedAt?: string;
  modulesUpdatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  suspendReason?: string;
  createdAt: string;
  updatedAt: string;
}
