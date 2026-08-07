import type { DemoMenuJson, MenuThemeId, PublicMenuData } from "@/types";
import { DEFAULT_MENU_THEME } from "@/constants/menu-themes";

function toTheme(value?: string): MenuThemeId {
  const normalized = value?.toLowerCase();
  if (normalized === "dark" || normalized === "rustic" || normalized === "minimal" || normalized === "savan") {
    return normalized;
  }
  return DEFAULT_MENU_THEME;
}

export function mapDemoMenuToPublic(data: DemoMenuJson, slug = "cafe-aroma"): PublicMenuData {
  return {
    restaurant: {
      name: data.restaurant,
      slug,
      tagline: data.tagline,
      rating: data.rating,
      address: data.address,
      timing: data.timing,
      currency: data.currency ?? "₹",
      theme: toTheme(data.theme),
    },
    categories: data.categories.map((category, index) => ({
      id: `category-${index}`,
      name: category.name,
      icon: category.icon,
      description: category.description,
      sortOrder: index,
      items: category.items,
    })),
  };
}
