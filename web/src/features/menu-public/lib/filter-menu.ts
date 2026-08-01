import type { DietFilter, MenuCategory, MenuItem } from "@/types";

export function filterMenuItems(
  items: MenuItem[],
  dietFilter: DietFilter,
  searchQuery: string,
): MenuItem[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (dietFilter === "veg" && !item.tags?.includes("veg")) return false;
    if (dietFilter === "non-veg" && !item.tags?.includes("non-veg")) return false;
    if (dietFilter === "vegan" && !item.tags?.includes("vegan")) return false;
    if (dietFilter === "gf" && !item.tags?.includes("gf")) return false;
    if (
      dietFilter === "chef" &&
      !item.badge?.toLowerCase().includes("chef")
    ) {
      return false;
    }

    if (!query) return true;

    const nameMatch = item.name.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query) ?? false;
    return nameMatch || descMatch;
  });
}

export function filterCategories(
  categories: MenuCategory[],
  dietFilter: DietFilter,
  searchQuery: string,
): MenuCategory[] {
  return categories
    .map((category) => ({
      ...category,
      items: filterMenuItems(category.items, dietFilter, searchQuery),
    }))
    .filter((category) => category.items.length > 0);
}

export function formatPrice(currency: string, price: number): string {
  return `${currency} ${price}`;
}
