import { createCategory } from "@/lib/firebase/categories";
import { createMenuItem } from "@/lib/firebase/menu-items";
import { listCategories } from "@/lib/firebase/categories";

const STARTER_MENU = [
  {
    name: "Starters",
    icon: "🥗",
    description: "Light bites to begin the meal.",
    items: [
      {
        name: "Tomato Soup",
        price: 160,
        description: "Classic cream of tomato with toasted croutons.",
        tags: ["veg"],
        badge: "Popular",
      },
      {
        name: "Crispy Corn",
        price: 220,
        description: "Golden fried corn tossed with spices and herbs.",
        tags: ["veg", "vegan"],
        badge: "",
      },
    ],
  },
  {
    name: "Mains",
    icon: "🍽️",
    description: "Hearty plates your guests will love.",
    items: [
      {
        name: "Paneer Butter Masala",
        price: 320,
        description: "Cottage cheese in a rich tomato-butter gravy.",
        tags: ["veg"],
        badge: "Chef's Special",
      },
      {
        name: "Butter Chicken",
        price: 380,
        description: "Tender chicken simmered in creamy makhani sauce.",
        tags: ["non-veg"],
        badge: "Popular",
      },
    ],
  },
  {
    name: "Drinks",
    icon: "☕",
    description: "Hot and cold refreshments.",
    items: [
      {
        name: "Masala Chai",
        price: 80,
        description: "House-spiced Indian tea with milk.",
        tags: ["veg"],
        badge: "",
      },
      {
        name: "Fresh Lime Soda",
        price: 120,
        description: "Sweet or salted — ask your server.",
        tags: ["veg", "vegan", "gf"],
        badge: "Healthy",
      },
    ],
  },
] as const;

/**
 * Creates a few sample categories + dishes so new owners see a working menu
 * immediately and can edit instead of starting from a blank page.
 */
export async function seedStarterMenu(restaurantId: string): Promise<void> {
  const existing = await listCategories(restaurantId);
  if (existing.length > 0) return;

  for (const [categoryIndex, category] of STARTER_MENU.entries()) {
    const created = await createCategory(
      restaurantId,
      {
        name: category.name,
        icon: category.icon,
        description: category.description,
        isVisible: true,
      },
      categoryIndex,
    );

    for (const [itemIndex, item] of category.items.entries()) {
      await createMenuItem(
        restaurantId,
        {
          categoryId: created.id,
          name: item.name,
          description: item.description,
          price: item.price,
          badge: item.badge || undefined,
          tags: [...item.tags],
          isAvailable: true,
        },
        itemIndex,
      );
    }
  }
}
