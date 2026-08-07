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
  publicMenu: (slug: string) => `/m/${slug}`,
  admin: "/admin",
  adminApprovals: "/admin/approvals",
  adminOwners: "/admin/owners",
  adminRestaurants: "/admin/restaurants",
  adminRestaurant: (id: string) => `/admin/restaurants/${id}`,
  adminRestaurantMenu: (id: string) => `/admin/restaurants/${id}/menu`,
} as const;

export const DASHBOARD_NAV = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.orders, label: "Orders" },
  { href: ROUTES.restaurant, label: "Restaurant" },
  { href: ROUTES.categories, label: "Categories" },
  { href: ROUTES.menuItems, label: "Menu Items" },
  { href: ROUTES.themes, label: "Themes" },
  { href: ROUTES.qr, label: "QR Code" },
  { href: ROUTES.settings, label: "Settings" },
] as const;

export const ADMIN_NAV = [
  { href: ROUTES.admin, label: "Overview" },
  { href: ROUTES.adminApprovals, label: "Approvals" },
  { href: ROUTES.adminRestaurants, label: "Restaurants" },
  { href: ROUTES.adminOwners, label: "Owners" },
] as const;
