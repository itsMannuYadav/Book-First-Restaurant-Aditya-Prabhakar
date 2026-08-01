import type { GuestOrderView, OrderStatus } from "@/types";

const OPEN_STATUSES: OrderStatus[] = ["pending", "confirmed", "ready"];

type StoredTicket = {
  orderId: string;
  accessToken: string;
  shortCode: string;
  restaurantId: string;
  savedAt: string;
};

function storageKey(restaurantId: string): string {
  return `bf_order_ticket_${restaurantId}`;
}

export function saveOrderTicket(
  restaurantId: string,
  ticket: Omit<StoredTicket, "restaurantId" | "savedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: StoredTicket = {
    ...ticket,
    restaurantId,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(payload));
  } catch {
    // private mode / quota
  }
}

export function loadOrderTicket(restaurantId: string): StoredTicket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(restaurantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTicket;
    if (!parsed.orderId || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOrderTicket(restaurantId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(restaurantId));
  } catch {
    // ignore
  }
}

export function isOpenGuestOrder(order: GuestOrderView | null): boolean {
  if (!order) return false;
  return OPEN_STATUSES.includes(order.status);
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
