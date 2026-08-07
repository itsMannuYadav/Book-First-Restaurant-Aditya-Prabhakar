import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso } from "@/lib/utils/string";
import {
  adminListCategories,
  adminListMenuItems,
} from "@/lib/admin/server";
import { parseMenuCsv } from "@/lib/admin/csv-menu-shared";

export {
  CSV_MENU_HEADERS,
  CSV_MENU_TEMPLATE,
  buildMenuCsv,
  parseMenuCsv,
} from "@/lib/admin/csv-menu-shared";

export async function importMenuCsv(input: {
  restaurantId: string;
  csvText: string;
  mode: "append" | "replace";
}): Promise<{
  createdCategories: number;
  createdItems: number;
  deletedItems: number;
  errors: Array<{ rowNumber: number; message: string }>;
}> {
  const { rows, errors } = parseMenuCsv(input.csvText);
  if (errors.length > 0 && rows.length === 0) {
    return {
      createdCategories: 0,
      createdItems: 0,
      deletedItems: 0,
      errors,
    };
  }

  const db = getAdminDb();
  let categories = await adminListCategories(input.restaurantId);
  const categoryByName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c]),
  );

  let createdCategories = 0;
  const neededNames = [...new Set(rows.map((r) => r.category.trim()))];
  for (const name of neededNames) {
    const key = name.toLowerCase();
    if (categoryByName.has(key)) continue;
    const timestamp = nowIso();
    const payload = {
      restaurantId: input.restaurantId,
      name,
      icon: "",
      description: "",
      isVisible: true,
      sortOrder: categories.length + createdCategories,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const ref = await db.collection(COLLECTIONS.categories).add(payload);
    const created = {
      id: ref.id,
      restaurantId: input.restaurantId,
      name,
      sortOrder: payload.sortOrder,
      isVisible: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    categoryByName.set(key, created);
    createdCategories += 1;
  }

  categories = [...categoryByName.values()];

  let deletedItems = 0;
  if (input.mode === "replace") {
    const existingItems = await adminListMenuItems(input.restaurantId);
    const categoryIds = new Set(
      neededNames
        .map((n) => categoryByName.get(n.toLowerCase())?.id)
        .filter(Boolean),
    );
    const toDelete = existingItems.filter((item) =>
      categoryIds.has(item.categoryId),
    );
    const chunkSize = 400;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const batch = db.batch();
      for (const item of toDelete.slice(i, i + chunkSize)) {
        batch.delete(db.collection(COLLECTIONS.menuItems).doc(item.id));
      }
      await batch.commit();
    }
    deletedItems = toDelete.length;
  }

  const existingItems = await adminListMenuItems(input.restaurantId);
  let sortBase = existingItems.length;
  const timestamp = nowIso();
  let createdItems = 0;
  const chunkSize = 400;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const row of chunk) {
      const category = categoryByName.get(row.category.trim().toLowerCase());
      if (!category) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Category not found: ${row.category}`,
        });
        continue;
      }
      const ref = db.collection(COLLECTIONS.menuItems).doc();
      batch.set(ref, {
        restaurantId: input.restaurantId,
        categoryId: category.id,
        name: row.name.trim(),
        description: row.description ?? "",
        price: row.price,
        imageUrl: "",
        tags: row.tagList,
        badge: row.badge ?? "",
        isAvailable: row.available,
        sortOrder: row.sort ?? sortBase,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      sortBase += 1;
      createdItems += 1;
    }
    await batch.commit();
  }

  return { createdCategories, createdItems, deletedItems, errors };
}
