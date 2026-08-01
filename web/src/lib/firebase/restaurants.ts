import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { nowIso, slugify, uniqueSlug } from "@/lib/utils/string";
import { formatHours, DEFAULT_HOURS } from "@/lib/utils/hours";
import { seedStarterMenu } from "@/lib/firebase/seed-menu";
import type { Restaurant, RestaurantStatus } from "@/types";
import type { MenuThemeId } from "@/types";
import type { RestaurantInput } from "@/lib/validators/forms";

type CreateRestaurantInput = {
  ownerId: string;
  name: string;
};

function mapRestaurant(id: string, data: Record<string, unknown>): Restaurant {
  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    name: String(data.name ?? ""),
    slug: slugify(String(data.slug ?? "")) || String(data.slug ?? ""),
    tagline: data.tagline ? String(data.tagline) : undefined,
    description: data.description ? String(data.description) : undefined,
    logoUrl: data.logoUrl ? String(data.logoUrl) : undefined,
    coverUrl: data.coverUrl ? String(data.coverUrl) : undefined,
    address: data.address ? String(data.address) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    timing: data.timing ? String(data.timing) : undefined,
    currency: String(data.currency ?? "₹"),
    theme: (data.theme as MenuThemeId) ?? "dark",
    status: (data.status as RestaurantStatus) ?? "draft",
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function isSlugAvailable(
  slug: string,
  excludeRestaurantId?: string,
): Promise<boolean> {
  const { db } = requireFirebase();
  const normalized = slugify(slug);
  if (!normalized) return false;

  const q = query(
    collection(db, COLLECTIONS.restaurants),
    where("slug", "==", normalized),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  return snap.docs[0]!.id === excludeRestaurantId;
}

export async function createRestaurant(
  input: CreateRestaurantInput,
): Promise<Restaurant> {
  const { db } = requireFirebase();
  const ref = doc(collection(db, COLLECTIONS.restaurants));
  const timestamp = nowIso();

  const base = slugify(input.name) || "restaurant";
  // Firestore doc ids can contain uppercase — always lowercase the suffix.
  let slug = uniqueSlug(input.name, ref.id);

  try {
    if (await isSlugAvailable(base)) {
      slug = base;
    } else if (!(await isSlugAvailable(slug))) {
      slug = uniqueSlug(input.name, `${ref.id}${Date.now().toString(36)}`);
    }
  } catch {
    slug = uniqueSlug(input.name, ref.id);
  }

  const payload = {
    ownerId: input.ownerId,
    name: input.name,
    slug,
    tagline: "Fresh flavors · Warm hospitality · Made with care",
    description:
      "Welcome to our kitchen. Update this text with your story, specialties, and what guests should try first.",
    logoUrl: "",
    coverUrl: "",
    address: "Add your street address here",
    phone: "+91 98765 43210",
    timing: formatHours(DEFAULT_HOURS),
    currency: "₹",
    theme: "rustic" as MenuThemeId,
    status: "draft" as RestaurantStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(ref, payload);
  const restaurant = mapRestaurant(ref.id, payload);

  try {
    await seedStarterMenu(restaurant.id);
  } catch {
    // Seeding is best-effort; owner can still add categories manually.
  }

  return restaurant;
}

export async function getRestaurantByOwnerId(
  ownerId: string,
): Promise<Restaurant | null> {
  const { db } = requireFirebase();
  const q = query(
    collection(db, COLLECTIONS.restaurants),
    where("ownerId", "==", ownerId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0]!;
  return mapRestaurant(docSnap.id, docSnap.data());
}

export async function getRestaurantById(
  id: string,
): Promise<Restaurant | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.restaurants, id));
  if (!snap.exists()) return null;
  return mapRestaurant(snap.id, snap.data());
}

export async function getRestaurantBySlug(
  slug: string,
): Promise<Restaurant | null> {
  const { db } = requireFirebase();
  const normalized = slugify(slug);
  const q = query(
    collection(db, COLLECTIONS.restaurants),
    where("slug", "==", normalized),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0]!;
  return mapRestaurant(docSnap.id, docSnap.data());
}

/** Fix legacy slugs that included uppercase Firestore id characters. */
export async function normalizeRestaurantSlug(
  restaurant: Restaurant,
): Promise<Restaurant> {
  const normalized = slugify(restaurant.slug);
  if (!normalized || normalized === restaurant.slug) {
    return { ...restaurant, slug: normalized || restaurant.slug };
  }

  const { db } = requireFirebase();
  try {
    const available = await isSlugAvailable(normalized, restaurant.id);
    const nextSlug = available
      ? normalized
      : uniqueSlug(restaurant.name, restaurant.id);

    await updateDoc(doc(db, COLLECTIONS.restaurants, restaurant.id), {
      slug: nextSlug,
      updatedAt: nowIso(),
    });

    return { ...restaurant, slug: nextSlug };
  } catch {
    return { ...restaurant, slug: normalized };
  }
}

export async function updateRestaurant(
  id: string,
  input: RestaurantInput,
): Promise<void> {
  const { db } = requireFirebase();
  const slug = slugify(input.slug);

  if (!slug) {
    throw new Error("Menu URL must use lowercase letters, numbers, and hyphens.");
  }

  const current = await getRestaurantById(id);
  if (!current) {
    throw new Error("Restaurant not found. Please refresh and try again.");
  }

  // Only check uniqueness when the slug actually changes.
  if (slug !== current.slug) {
    try {
      const available = await isSlugAvailable(slug, id);
      if (!available) {
        throw new Error(
          "That menu URL is already taken. Try another like my-cafe or spice-house.",
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("already taken")) {
        throw err;
      }
      // Fall through — uniqueness check failed due to rules; still attempt save.
    }
  }

  await updateDoc(doc(db, COLLECTIONS.restaurants, id), {
    name: input.name.trim(),
    slug,
    tagline: input.tagline?.trim() ?? "",
    description: input.description?.trim() ?? "",
    address: input.address?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    timing: input.timing?.trim() ?? "",
    currency: input.currency.trim() || "₹",
    theme: input.theme,
    status: input.status,
    updatedAt: nowIso(),
  });
}

export async function updateRestaurantTheme(
  id: string,
  theme: MenuThemeId,
): Promise<void> {
  const { db } = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.restaurants, id), {
    theme,
    updatedAt: nowIso(),
  });
}
