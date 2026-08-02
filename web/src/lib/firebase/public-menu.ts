import { listCategories } from "@/lib/firebase/categories";
import { listMenuItems } from "@/lib/firebase/menu-items";
import { getRestaurantBySlug } from "@/lib/firebase/restaurants";
import { slugify } from "@/lib/utils/string";
import type { Category, DietTag, MenuItemRecord, PublicMenuData } from "@/types";

export async function getPublicMenuBySlug(
  slug: string,
): Promise<PublicMenuData | null> {
  const restaurant = await getRestaurantBySlug(slugify(slug) || slug);
  if (!restaurant) return null;
  if (restaurant.status === "archived") return null;

  let categories: Category[] = [];
  let items: MenuItemRecord[] = [];

  try {
    [categories, items] = await Promise.all([
      listCategories(restaurant.id),
      listMenuItems(restaurant.id),
    ]);
  } catch {
    categories = [];
    items = [];
  }

  const visibleCategories = categories.filter((c) => c.isVisible);

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      tagline: restaurant.tagline || undefined,
      logoUrl: restaurant.logoUrl || undefined,
      coverUrl: restaurant.coverUrl || undefined,
      address: restaurant.address || undefined,
      timing: restaurant.timing || undefined,
      phone: restaurant.phone || undefined,
      currency: restaurant.currency,
      theme: restaurant.theme,
      status: restaurant.status,
      orderingEnabled: restaurant.orderingEnabled,
      requireGuestGps: restaurant.requireGuestGps !== false,
      location: restaurant.location,
      orderGeoRadiusMeters: restaurant.orderGeoRadiusMeters,
      tables: restaurant.tables
        .filter((t) => t.isActive)
        .map((t) => ({ id: t.id, label: t.label })),
    },
    categories: visibleCategories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon || undefined,
      description: category.description || undefined,
      sortOrder: category.sortOrder,
      items: items
        .filter(
          (item) =>
            item.categoryId === category.id && item.isAvailable !== false,
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || undefined,
          tags: item.tags as DietTag[],
          badge: item.badge || undefined,
          imageUrl: item.imageUrl || undefined,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
        })),
    })),
  };
}
