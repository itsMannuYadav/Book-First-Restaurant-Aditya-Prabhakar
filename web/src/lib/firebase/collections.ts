/**
 * Firestore collection names.
 * Keep centralized so future modules (orders, analytics, etc.) plug in cleanly.
 */
export const COLLECTIONS = {
  users: "users",
  restaurants: "restaurants",
  categories: "categories",
  menuItems: "menuItems",
  orders: "orders",
  /** Server-only idempotency keys for guest order placement. */
  orderIdempotency: "orderIdempotency",
  /** Server-only admin action trail (Admin SDK writes). */
  adminAuditLogs: "adminAuditLogs",
} as const;
