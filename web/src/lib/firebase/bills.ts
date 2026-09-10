import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso } from "@/lib/utils/string";
import {
  computeTotals,
  normalizeLineItems,
} from "@/features/billing/lib/bill-calcs";
import { billSnapshotFrom, mapBillData } from "@/features/billing/lib/map-bill";
import type { Bill, BillDraftInput, Restaurant } from "@/types";

function draftPayload(
  restaurant: Restaurant,
  draft: BillDraftInput,
  timestamp: string,
) {
  const lineItems = normalizeLineItems(draft.lineItems);
  const totals = computeTotals(lineItems, draft.discount, draft.taxRate);
  return {
    restaurantId: restaurant.id,
    ownerId: restaurant.ownerId,
    orderId: draft.orderId ?? null,
    status: "draft" as const,
    billNumber: null,
    billLabel: "",
    customerName: draft.customerName?.trim() ?? "",
    customerPhone: draft.customerPhone?.trim() ?? "",
    customerGstin: draft.customerGstin?.trim().toUpperCase() ?? "",
    lineItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    currency: restaurant.currency || "₹",
    notes: draft.notes?.trim() ?? "",
    restaurantSnapshot: billSnapshotFrom(restaurant),
    updatedAt: timestamp,
  };
}

export function subscribeOwnerBills(
  restaurantId: string,
  onBills: (bills: Bill[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  // Equality-only query (no composite index needed); sort client-side.
  const q = query(
    collection(db, COLLECTIONS.bills),
    where("restaurantId", "==", restaurantId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const bills = snap.docs
        .map((d) => mapBillData(d.id, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onBills(bills);
    },
    (err) => onError?.(err.message || "Failed to load bills"),
  );
}

export async function getBill(billId: string): Promise<Bill | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.bills, billId));
  if (!snap.exists()) return null;
  return mapBillData(snap.id, snap.data());
}

export async function createDraftBill(
  restaurant: Restaurant,
  draft: BillDraftInput,
  createdByUid: string,
): Promise<string> {
  const { db } = requireFirebase();
  const timestamp = nowIso();
  const ref = await addDoc(collection(db, COLLECTIONS.bills), {
    ...draftPayload(restaurant, draft, timestamp),
    createdByUid,
    createdAt: timestamp,
  });
  return ref.id;
}

export async function updateDraftBill(
  billId: string,
  restaurant: Restaurant,
  draft: BillDraftInput,
): Promise<void> {
  const { db } = requireFirebase();
  const timestamp = nowIso();
  await updateDoc(doc(db, COLLECTIONS.bills, billId), {
    ...draftPayload(restaurant, draft, timestamp),
  });
}

export async function deleteDraftBill(billId: string): Promise<void> {
  const { db } = requireFirebase();
  await deleteDoc(doc(db, COLLECTIONS.bills, billId));
}
