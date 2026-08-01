import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso } from "@/lib/utils/string";
import type {
  OrderGuestLocation,
  OrderLineItem,
  OrderStatus,
  OrderStatusEvent,
  OwnerOrderView,
} from "@/types";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  declined: [],
  completed: [],
  cancelled: [],
};

function mapOwnerOrder(
  id: string,
  data: Record<string, unknown>,
): OwnerOrderView {
  return {
    id,
    restaurantId: String(data.restaurantId ?? ""),
    shortCode: String(data.shortCode ?? ""),
    tableId: String(data.tableId ?? ""),
    tableLabel: String(data.tableLabel ?? ""),
    items: (data.items as OrderLineItem[]) ?? [],
    currency: String(data.currency ?? "₹"),
    total: Number(data.total ?? 0),
    status: data.status as OrderStatus,
    guestNote: data.guestNote ? String(data.guestNote) : undefined,
    ownerNote: data.ownerNote ? String(data.ownerNote) : undefined,
    guestLocation: data.guestLocation as OrderGuestLocation,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
    statusHistory: (data.statusHistory as OrderStatusEvent[]) ?? [],
  };
}

export function subscribeOwnerOrders(
  restaurantId: string,
  onOrders: (orders: OwnerOrderView[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  // Equality-only query avoids requiring a composite index; sort client-side.
  const q = query(
    collection(db, COLLECTIONS.orders),
    where("restaurantId", "==", restaurantId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => mapOwnerOrder(d.id, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onOrders(orders);
    },
    (err) => {
      onError?.(err.message || "Failed to load orders");
    },
  );
}

export async function updateOrderStatus(
  order: OwnerOrderView,
  nextStatus: OrderStatus,
  ownerNote?: string,
): Promise<void> {
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot move order from ${order.status} to ${nextStatus}`);
  }

  const { db } = requireFirebase();
  const timestamp = nowIso();
  const note = ownerNote?.trim();
  const statusHistory: OrderStatusEvent[] = [
    ...(order.statusHistory ?? []),
    {
      status: nextStatus,
      at: timestamp,
      ...(note ? { note } : {}),
    },
  ];

  await updateDoc(doc(db, COLLECTIONS.orders, order.id), {
    status: nextStatus,
    updatedAt: timestamp,
    statusHistory,
    ...(note !== undefined ? { ownerNote: note } : {}),
  });
}

export function countPendingOrders(orders: OwnerOrderView[]): number {
  return orders.filter((o) => o.status === "pending").length;
}
