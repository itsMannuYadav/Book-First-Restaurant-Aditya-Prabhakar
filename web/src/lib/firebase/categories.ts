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
import type { Category } from "@/types";
import type { CategoryInput } from "@/lib/validators/forms";

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    restaurantId: String(data.restaurantId ?? ""),
    name: String(data.name ?? ""),
    icon: data.icon ? String(data.icon) : undefined,
    description: data.description ? String(data.description) : undefined,
    sortOrder: Number(data.sortOrder ?? 0),
    isVisible: Boolean(data.isVisible ?? true),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function listCategories(
  restaurantId: string,
): Promise<Category[]> {
  const { db } = requireFirebase();
  const q = query(
    collection(db, COLLECTIONS.categories),
    where("restaurantId", "==", restaurantId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapCategory(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCategory(
  restaurantId: string,
  input: CategoryInput,
  sortOrder: number,
): Promise<Category> {
  const { db } = requireFirebase();
  const timestamp = nowIso();
  const payload = {
    restaurantId,
    name: input.name,
    icon: input.icon ?? "",
    description: input.description ?? "",
    isVisible: input.isVisible,
    sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ref = await addDoc(collection(db, COLLECTIONS.categories), payload);
  return mapCategory(ref.id, payload);
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.categories, id), {
    name: input.name,
    icon: input.icon ?? "",
    description: input.description ?? "",
    isVisible: input.isVisible,
    updatedAt: nowIso(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const { db } = requireFirebase();
  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}
