import type { ModuleKey, ModulePreset, OwnerModules } from "@/types";
import { ROUTES } from "@/constants/routes";

/** Every module key, in display order. Extend this to add a module. */
export const MODULE_KEYS = ["menu", "orders", "billing"] as const;

export const MODULE_LABELS: Record<ModuleKey, string> = {
  menu: "Menu & public page",
  orders: "Orders",
  billing: "Billing",
};

export const MODULE_DESCRIPTIONS: Record<ModuleKey, string> = {
  menu: "Restaurant profile, categories, menu items, themes, QR code, and the public /m page.",
  orders: "Dine-in order tickets from the guest menu.",
  billing: "Customer bills and invoices.",
};

/** Preset -> concrete flags. `custom` is derived, never stored as a preset target. */
export const MODULE_PRESETS: Record<
  Exclude<ModulePreset, "custom">,
  OwnerModules
> = {
  core: { menu: true, orders: true, billing: false },
  billing_only: { menu: false, orders: false, billing: true },
  full: { menu: true, orders: true, billing: true },
};

export const PRESET_LABELS: Record<ModulePreset, string> = {
  core: "Core (menu + orders)",
  billing_only: "Billing only",
  full: "Full (everything)",
  custom: "Custom",
};

/** Sensible default for new signups and legacy owners with no `modules` field. */
export const DEFAULT_MODULES: OwnerModules = MODULE_PRESETS.core;
export const DEFAULT_PRESET: ModulePreset = "core";

/** Dashboard routes and the module each one belongs to. Untagged routes are always allowed. */
export const ROUTE_MODULE: Array<{ prefix: string; module: ModuleKey }> = [
  { prefix: ROUTES.billing, module: "billing" },
  { prefix: ROUTES.orders, module: "orders" },
  { prefix: ROUTES.restaurant, module: "menu" },
  { prefix: ROUTES.categories, module: "menu" },
  { prefix: ROUTES.menuItems, module: "menu" },
  { prefix: ROUTES.themes, module: "menu" },
  { prefix: ROUTES.qr, module: "menu" },
];

export function normalizeModules(
  raw: Partial<OwnerModules> | null | undefined,
): OwnerModules {
  const base = { ...DEFAULT_MODULES };
  if (raw && typeof raw === "object") {
    for (const key of MODULE_KEYS) {
      if (typeof raw[key] === "boolean") base[key] = raw[key] as boolean;
    }
  }
  return base;
}

/** Which stored preset (if any) a set of flags matches, else "custom". */
export function detectPreset(modules: OwnerModules): ModulePreset {
  for (const name of ["core", "billing_only", "full"] as const) {
    const preset = MODULE_PRESETS[name];
    if (MODULE_KEYS.every((k) => preset[k] === modules[k])) return name;
  }
  return "custom";
}

export function resolveModules(input: {
  preset?: ModulePreset | null;
  modules?: Partial<OwnerModules> | null;
}): OwnerModules {
  if (input.preset && input.preset !== "custom") {
    return { ...MODULE_PRESETS[input.preset] };
  }
  return normalizeModules(input.modules);
}

/** Required module for a dashboard pathname, or null if always allowed. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const match = ROUTE_MODULE.find(
    (entry) =>
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  );
  return match ? match.module : null;
}

/** Where an owner lands: Billing when that's all they have, else the dashboard. */
export function moduleHome(modules: OwnerModules): string {
  if (!modules.menu && !modules.orders && modules.billing) {
    return ROUTES.billing;
  }
  return ROUTES.dashboard;
}
