import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/utils/string";
import type { AdminActor } from "@/lib/admin/auth";

export async function writeAdminAuditLog(input: {
  actor: AdminActor;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.adminAuditLogs).add({
    actorUid: input.actor.uid,
    actorEmail: input.actor.email,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    meta: input.meta ?? {},
    createdAt: nowIso(),
  });
}
