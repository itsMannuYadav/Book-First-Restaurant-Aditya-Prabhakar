import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso } from "@/lib/utils/string";
import type { MenuItemRecord } from "@/types";
import type { MenuItemInput } from "@/lib/validators/forms";

function mapItem(id: string, data: Record<string, unknown>): MenuItemRecord {
  return {
    id,
    restaurantId: String(data.restaurantId ?? ""),
    categoryId: String(data.categoryId ?? ""),
    name: String(data.name ?? ""),
    description: data.description ? String(data.description) : undefined,
    price: Number(data.price ?? 0),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    badge: data.badge ? String(data.badge) : undefined,
    isAvailable: Boolean(data.isAvailable ?? true),
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function listMenuItems(
  restaurantId: string,
): Promise<MenuItemRecord[]> {
  const { db } = requireFirebase();
  const q = query(
    collection(db, COLLECTIONS.menuItems),
    where("restaurantId", "==", restaurantId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapItem(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput,
  sortOrder: number,
): Promise<MenuItemRecord> {
  const { db } = requireFirebase();
  const timestamp = nowIso();
  const payload = {
    restaurantId,
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? "",
    price: input.price,
    imageUrl: "",
    tags: input.tags,
    badge: input.badge ?? "",
    isAvailable: input.isAvailable,
    sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ref = await addDoc(collection(db, COLLECTIONS.menuItems), payload);
  return mapItem(ref.id, payload);
}

export async function updateMenuItem(
  id: string,
  input: MenuItemInput,
): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.menuItems, id), {
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? "",
    price: input.price,
    tags: input.tags,
    badge: input.badge ?? "",
    isAvailable: input.isAvailable,
    updatedAt: nowIso(),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { db } = requireFirebase();
  await deleteDoc(doc(db, COLLECTIONS.menuItems, id));
}
