import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/utils/string";
import {
  BILL_STATUS_TRANSITIONS,
  financialYearKey,
  formatBillNumber,
  istNow,
} from "@/constants/billing";
import { billSnapshotFrom, mapBillData } from "@/features/billing/lib/map-bill";
import { OwnerAuthError, type OwnerActor } from "@/lib/owner/auth";
import type { Bill } from "@/types";

async function writeBillAuditLog(input: {
  actor: OwnerActor;
  action: string;
  billId: string;
  meta?: Record<string, unknown>;
}) {
  await getAdminDb()
    .collection(COLLECTIONS.billAuditLogs)
    .add({
      actorUid: input.actor.uid,
      actorEmail: input.actor.email,
      action: input.action,
      billId: input.billId,
      meta: input.meta ?? {},
      createdAt: nowIso(),
    });
}

/** Assigns the gapless per-restaurant, per-financial-year number and freezes identity. */
export async function finalizeBill(
  billId: string,
  actor: OwnerActor,
): Promise<Bill> {
  const db = getAdminDb();
  const billRef = db.collection(COLLECTIONS.bills).doc(billId);
  const now = istNow(); // FY key + invoice date in IST
  const timestamp = new Date().toISOString(); // real UTC timestamp for storage

  const finalized = await db.runTransaction(async (tx) => {
    const billSnap = await tx.get(billRef);
    if (!billSnap.exists) throw new OwnerAuthError("Bill not found.", 404);
    const bill = mapBillData(billSnap.id, billSnap.data() ?? {});
    if (bill.ownerId !== actor.uid) {
      throw new OwnerAuthError("This bill belongs to another account.", 403);
    }
    if (bill.status !== "draft") {
      throw new OwnerAuthError(`This bill is already ${bill.status}.`, 409);
    }
    if (bill.lineItems.length === 0) {
      throw new OwnerAuthError("Add at least one line item before finalizing.", 422);
    }

    const restRef = db.collection(COLLECTIONS.restaurants).doc(bill.restaurantId);
    const restSnap = await tx.get(restRef);
    if (!restSnap.exists) throw new OwnerAuthError("Restaurant not found.", 404);
    const rd = restSnap.data() ?? {};

    const fyKey = financialYearKey(now);
    const counterRef = db
      .collection(COLLECTIONS.billCounters)
      .doc(`${bill.restaurantId}_${fyKey}`);
    const counterSnap = await tx.get(counterRef);
    const prev = counterSnap.exists ? Number(counterSnap.data()?.next ?? 0) : 0;
    const nextSeq = (Number.isFinite(prev) ? prev : 0) + 1;
    const billLabel = formatBillNumber(nextSeq, now);

    tx.set(
      counterRef,
      {
        restaurantId: bill.restaurantId,
        fyKey,
        next: nextSeq,
        updatedAt: timestamp,
      },
      { merge: true },
    );

    const snapshot = billSnapshotFrom({
      name: String(rd.name ?? bill.restaurantSnapshot.name ?? ""),
      logoUrl: rd.logoUrl ? String(rd.logoUrl) : undefined,
      address: rd.address ? String(rd.address) : undefined,
      phone: rd.phone ? String(rd.phone) : undefined,
      gstin: rd.gstin ? String(rd.gstin) : undefined,
    });

    tx.update(billRef, {
      status: "finalized",
      billNumber: nextSeq,
      billLabel,
      restaurantSnapshot: snapshot,
      finalizedAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      ...bill,
      status: "finalized" as const,
      billNumber: nextSeq,
      billLabel,
      restaurantSnapshot: snapshot,
      finalizedAt: timestamp,
      updatedAt: timestamp,
    };
  });

  await writeBillAuditLog({
    actor,
    action: "bill.finalize",
    billId,
    meta: { billNumber: finalized.billNumber, billLabel: finalized.billLabel },
  });

  return finalized;
}

export async function setBillStatus(
  billId: string,
  actor: OwnerActor,
  target: "paid" | "void",
): Promise<Bill> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.bills).doc(billId);
  const snap = await ref.get();
  if (!snap.exists) throw new OwnerAuthError("Bill not found.", 404);

  const bill = mapBillData(snap.id, snap.data() ?? {});
  if (bill.ownerId !== actor.uid) {
    throw new OwnerAuthError("This bill belongs to another account.", 403);
  }

  const allowed = BILL_STATUS_TRANSITIONS[bill.status] ?? [];
  if (!allowed.includes(target)) {
    throw new OwnerAuthError(
      `A ${bill.status} bill can’t be marked ${target}.`,
      409,
    );
  }

  const timestamp = nowIso();
  const patch: Record<string, unknown> = { status: target, updatedAt: timestamp };
  if (target === "paid") patch.paidAt = timestamp;
  if (target === "void") patch.voidedAt = timestamp;

  await ref.update(patch);
  await writeBillAuditLog({ actor, action: `bill.${target}`, billId });

  return { ...bill, ...(patch as Partial<Bill>) };
}
