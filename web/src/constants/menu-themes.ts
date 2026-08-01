import type { MenuThemeId } from "@/types";

export interface MenuThemeOption {
  id: MenuThemeId;
  label: string;
  shortLabel: string;
}

export const MENU_THEMES: MenuThemeOption[] = [
  { id: "dark", label: "Dark Luxury", shortLabel: "Dark" },
  { id: "rustic", label: "Rustic Wooden", shortLabel: "Rustic" },
  { id: "minimal", label: "Minimal White", shortLabel: "Minimal" },
];

export const DEFAULT_MENU_THEME: MenuThemeId = "dark";

export const DIET_FILTERS = [
  { id: "all" as const, label: "All Items" },
  { id: "veg" as const, label: "Vegetarian" },
  { id: "non-veg" as const, label: "Non-Veg" },
  { id: "vegan" as const, label: "Vegan" },
  { id: "gf" as const, label: "Gluten-Free" },
  { id: "chef" as const, label: "Chef's Special" },
];
