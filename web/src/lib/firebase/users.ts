import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso } from "@/lib/utils/string";
import type { AccountStatus, UserProfile, UserRole } from "@/types";

function mapUser(id: string, data: Record<string, unknown>): UserProfile {
  const accountStatus = (data.accountStatus as AccountStatus | undefined) ?? "active";
  const role = (data.role as UserRole | undefined) ?? "owner";
  return {
    uid: String(data.uid ?? id),
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    role,
    accountStatus,
    approvedAt: data.approvedAt ? String(data.approvedAt) : undefined,
    approvedBy: data.approvedBy ? String(data.approvedBy) : undefined,
    suspendedAt: data.suspendedAt ? String(data.suspendedAt) : undefined,
    suspendReason: data.suspendReason ? String(data.suspendReason) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data());
}

export async function ensureUserProfile(input: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
}): Promise<UserProfile> {
  const { db } = requireFirebase();
  const ref = doc(db, COLLECTIONS.users, input.uid);
  const existing = await getDoc(ref);
  const timestamp = nowIso();

  if (!existing.exists()) {
    const payload = {
      uid: input.uid,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      accountStatus: input.accountStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(input.accountStatus === "active"
        ? { approvedAt: timestamp, approvedBy: "system" }
        : {}),
    };
    await setDoc(ref, payload);
    return mapUser(input.uid, payload);
  }

  const data = existing.data();
  const patch: Record<string, unknown> = {
    updatedAt: timestamp,
  };

  // Keep email/displayName fresh; do not downgrade legacy active accounts.
  if (input.email && input.email !== data.email) patch.email = input.email;
  if (input.displayName && !data.displayName) {
    patch.displayName = input.displayName;
  }
  if (input.role === "admin" && data.role !== "admin") {
    patch.role = "admin";
    patch.accountStatus = "active";
  }
  if (data.accountStatus == null) {
    patch.accountStatus = "active";
  }
  if (data.role == null) {
    patch.role = input.role;
  }

  if (Object.keys(patch).length > 1) {
    await updateDoc(ref, patch);
  }

  return mapUser(input.uid, { ...data, ...patch });
}

export function canPublishRestaurant(input: {
  accountStatus: AccountStatus;
  approvalStatus: string;
}): boolean {
  return (
    input.accountStatus === "active" && input.approvalStatus === "approved"
  );
}
