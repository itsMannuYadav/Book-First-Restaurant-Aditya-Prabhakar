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
} as const;
