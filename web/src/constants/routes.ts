export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  restaurant: "/restaurant",
  categories: "/categories",
  menuItems: "/menu-items",
  themes: "/themes",
  qr: "/qr",
  settings: "/settings",
  publicMenu: (slug: string) => `/m/${slug}`,
} as const;

export const DASHBOARD_NAV = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.restaurant, label: "Restaurant" },
  { href: ROUTES.categories, label: "Categories" },
  { href: ROUTES.menuItems, label: "Menu Items" },
  { href: ROUTES.themes, label: "Themes" },
  { href: ROUTES.qr, label: "QR Code" },
  { href: ROUTES.settings, label: "Settings" },
] as const;
