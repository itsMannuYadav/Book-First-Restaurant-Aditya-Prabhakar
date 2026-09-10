import type { ModuleKey } from "@/types";

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  orders: "/orders",
  restaurant: "/restaurant",
  categories: "/categories",
  menuItems: "/menu-items",
  themes: "/themes",
  qr: "/qr",
  settings: "/settings",
  billing: "/billing",
  billingNew: "/billing/new",
  bill: (id: string) => `/billing/${id}`,
  billPrint: (id: string) => `/billing/${id}/print`,
  publicMenu: (slug: string) => `/m/${slug}`,
  ownerDemo: "/owner-demo",
  admin: "/admin",
  adminApprovals: "/admin/approvals",
  adminOwners: "/admin/owners",
  adminOwner: (uid: string) => `/admin/owners/${uid}`,
  adminRestaurants: "/admin/restaurants",
  adminRestaurant: (id: string) => `/admin/restaurants/${id}`,
  adminRestaurantMenu: (id: string) => `/admin/restaurants/${id}/menu`,
} as const;

/** `module` gates visibility + access; undefined = always shown. */
export const DASHBOARD_NAV: ReadonlyArray<{
  href: string;
  label: string;
  module?: ModuleKey;
}> = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.orders, label: "Orders", module: "orders" },
  { href: ROUTES.billing, label: "Billing", module: "billing" },
  { href: ROUTES.restaurant, label: "Restaurant", module: "menu" },
  { href: ROUTES.categories, label: "Categories", module: "menu" },
  { href: ROUTES.menuItems, label: "Menu Items", module: "menu" },
  { href: ROUTES.themes, label: "Themes", module: "menu" },
  { href: ROUTES.qr, label: "QR Code", module: "menu" },
  { href: ROUTES.settings, label: "Settings" },
];

export const ADMIN_NAV = [
  { href: ROUTES.admin, label: "Overview" },
  { href: ROUTES.adminApprovals, label: "Approvals" },
  { href: ROUTES.adminRestaurants, label: "Restaurants" },
  { href: ROUTES.adminOwners, label: "Owners" },
] as const;
