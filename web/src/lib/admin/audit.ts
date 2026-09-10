import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/utils/string";
import type { AdminActor } from "@/lib/admin/auth";

/** Firestore rejects `undefined` values — drop them (recursively) before writing. */
function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map(stripUndefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}

export async function writeAdminAuditLog(input: {
  actor: AdminActor;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  // Audit is best-effort — never let a logging failure fail the admin action.
  try {
    const db = getAdminDb();
    await db.collection(COLLECTIONS.adminAuditLogs).add({
      actorUid: input.actor.uid,
      actorEmail: input.actor.email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: stripUndefined(input.meta ?? {}),
      createdAt: nowIso(),
    });
  } catch (err) {
    console.error("[admin audit] write failed", err);
  }
}
