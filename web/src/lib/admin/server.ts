import type { DocumentData } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/utils/string";
import type {
  AccountStatus,
  Category,
  MenuItemRecord,
  Restaurant,
  RestaurantApprovalStatus,
  RestaurantStatus,
  UserProfile,
  UserRole,
} from "@/types";
import type { MenuThemeId } from "@/types";

function mapUser(id: string, data: DocumentData): UserProfile {
  return {
    uid: String(data.uid ?? id),
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    role: (data.role as UserRole | undefined) ?? "owner",
    accountStatus: (data.accountStatus as AccountStatus | undefined) ?? "active",
    approvedAt: data.approvedAt ? String(data.approvedAt) : undefined,
    approvedBy: data.approvedBy ? String(data.approvedBy) : undefined,
    suspendedAt: data.suspendedAt ? String(data.suspendedAt) : undefined,
    suspendReason: data.suspendReason ? String(data.suspendReason) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function mapRestaurant(id: string, data: DocumentData): Restaurant {
  const tables = Array.isArray(data.tables)
    ? data.tables
        .map((entry: unknown) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          const tid = String(row.id ?? "");
          const label = String(row.label ?? "").trim();
          if (!tid || !label) return null;
          return {
            id: tid,
            label,
            isActive: row.isActive !== false,
          };
        })
        .filter(Boolean)
    : [];

  let location: Restaurant["location"];
  if (data.location && typeof data.location === "object") {
    const lat = Number((data.location as { lat?: unknown }).lat);
    const lng = Number((data.location as { lng?: unknown }).lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      location = { lat, lng };
    }
  }

  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
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
    approvalStatus:
      (data.approvalStatus as RestaurantApprovalStatus | undefined) ??
      "approved",
    location,
    orderGeoRadiusMeters:
      typeof data.orderGeoRadiusMeters === "number"
        ? data.orderGeoRadiusMeters
        : 120,
    requireGuestGps: data.requireGuestGps !== false,
    orderingEnabled: Boolean(data.orderingEnabled),
    tables: tables as Restaurant["tables"],
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function mapCategory(id: string, data: DocumentData): Category {
  return {
    id,
    restaurantId: String(data.restaurantId ?? ""),
    name: String(data.name ?? ""),
    icon: data.icon ? String(data.icon) : undefined,
    description: data.description ? String(data.description) : undefined,
    sortOrder: Number(data.sortOrder ?? 0),
    isVisible: data.isVisible !== false,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function mapItem(id: string, data: DocumentData): MenuItemRecord {
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
    isAvailable: data.isAvailable !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function adminListOwners(): Promise<UserProfile[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.users).get();
  return snap.docs
    .map((d) => mapUser(d.id, d.data()))
    .filter((u) => u.role !== "admin")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adminListPendingOwners(): Promise<UserProfile[]> {
  const owners = await adminListOwners();
  return owners.filter((o) => o.accountStatus === "pending");
}

export async function adminPatchOwner(
  uid: string,
  patch: {
    accountStatus?: AccountStatus;
    suspendReason?: string;
    actorEmail: string;
  },
): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Owner not found.");

  const timestamp = nowIso();
  const next: Record<string, unknown> = {
    updatedAt: timestamp,
  };

  if (patch.accountStatus) {
    next.accountStatus = patch.accountStatus;
    if (patch.accountStatus === "active") {
      next.approvedAt = timestamp;
      next.approvedBy = patch.actorEmail;
      next.suspendedAt = null;
      next.suspendReason = null;
    }
    if (patch.accountStatus === "suspended") {
      next.suspendedAt = timestamp;
      next.suspendReason = patch.suspendReason?.trim() || "Suspended by admin";
    }
    if (patch.accountStatus === "pending") {
      next.approvedAt = null;
      next.approvedBy = null;
      next.suspendedAt = null;
      next.suspendReason = null;
    }
  }

  await ref.update(next);

  // Keep restaurant approval in sync when approving / rejecting.
  if (patch.accountStatus === "active" || patch.accountStatus === "pending") {
    const restaurants = await db
      .collection(COLLECTIONS.restaurants)
      .where("ownerId", "==", uid)
      .get();
    const batch = db.batch();
    for (const doc of restaurants.docs) {
      batch.update(doc.ref, {
        approvalStatus:
          patch.accountStatus === "active" ? "approved" : "pending",
        updatedAt: timestamp,
      });
    }
    if (!restaurants.empty) await batch.commit();
  }

  if (patch.accountStatus === "suspended") {
    const restaurants = await db
      .collection(COLLECTIONS.restaurants)
      .where("ownerId", "==", uid)
      .get();
    const batch = db.batch();
    for (const doc of restaurants.docs) {
      const status = String(doc.data().status ?? "draft");
      batch.update(doc.ref, {
        ...(status === "published" ? { status: "draft" } : {}),
        updatedAt: timestamp,
      });
    }
    if (!restaurants.empty) await batch.commit();
  }

  const updated = await ref.get();
  return mapUser(uid, updated.data() ?? {});
}

export async function adminListRestaurants(search?: string): Promise<
  Array<Restaurant & { ownerEmail?: string }>
> {
  const db = getAdminDb();
  const [restaurantsSnap, usersSnap] = await Promise.all([
    db.collection(COLLECTIONS.restaurants).get(),
    db.collection(COLLECTIONS.users).get(),
  ]);

  const emailByUid = new Map(
    usersSnap.docs.map((d) => [d.id, String(d.data().email ?? "")]),
  );

  let list = restaurantsSnap.docs.map((d) => {
    const restaurant = mapRestaurant(d.id, d.data());
    return {
      ...restaurant,
      ownerEmail: emailByUid.get(restaurant.ownerId),
    };
  });

  const q = search?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.ownerEmail ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }

  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function adminGetRestaurant(
  id: string,
): Promise<(Restaurant & { ownerEmail?: string }) | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.restaurants).doc(id).get();
  if (!snap.exists) return null;
  const restaurant = mapRestaurant(snap.id, snap.data() ?? {});
  const owner = await db.collection(COLLECTIONS.users).doc(restaurant.ownerId).get();
  return {
    ...restaurant,
    ownerEmail: owner.exists ? String(owner.data()?.email ?? "") : undefined,
  };
}

export async function adminPatchRestaurant(
  id: string,
  patch: Partial<{
    name: string;
    slug: string;
    tagline: string;
    description: string;
    address: string;
    phone: string;
    timing: string;
    currency: string;
    theme: MenuThemeId;
    status: RestaurantStatus;
    approvalStatus: RestaurantApprovalStatus;
    orderingEnabled: boolean;
    requireGuestGps: boolean;
  }>,
): Promise<Restaurant> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.restaurants).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Restaurant not found.");

  const current = mapRestaurant(id, snap.data() ?? {});
  const nextStatus = patch.status ?? current.status;
  const nextApproval = patch.approvalStatus ?? current.approvalStatus;

  if (nextStatus === "published" && nextApproval !== "approved") {
    throw new Error("Approve the restaurant before publishing.");
  }

  const payload: Record<string, unknown> = {
    updatedAt: nowIso(),
  };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) payload[key] = value;
  }

  await ref.update(payload);
  const updated = await ref.get();
  return mapRestaurant(id, updated.data() ?? {});
}

export async function adminListCategories(
  restaurantId: string,
): Promise<Category[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.categories)
    .where("restaurantId", "==", restaurantId)
    .get();
  return snap.docs
    .map((d) => mapCategory(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function adminListMenuItems(
  restaurantId: string,
): Promise<MenuItemRecord[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.menuItems)
    .where("restaurantId", "==", restaurantId)
    .get();
  return snap.docs
    .map((d) => mapItem(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function adminCreateCategory(
  restaurantId: string,
  input: {
    name: string;
    icon?: string;
    description?: string;
    isVisible?: boolean;
  },
): Promise<Category> {
  const existing = await adminListCategories(restaurantId);
  const timestamp = nowIso();
  const payload = {
    restaurantId,
    name: input.name.trim(),
    icon: input.icon ?? "",
    description: input.description ?? "",
    isVisible: input.isVisible !== false,
    sortOrder: existing.length,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ref = await getAdminDb().collection(COLLECTIONS.categories).add(payload);
  return mapCategory(ref.id, payload);
}

export async function adminUpdateCategory(
  id: string,
  input: {
    name: string;
    icon?: string;
    description?: string;
    isVisible?: boolean;
  },
): Promise<void> {
  await getAdminDb()
    .collection(COLLECTIONS.categories)
    .doc(id)
    .update({
      name: input.name.trim(),
      icon: input.icon ?? "",
      description: input.description ?? "",
      isVisible: input.isVisible !== false,
      updatedAt: nowIso(),
    });
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await getAdminDb().collection(COLLECTIONS.categories).doc(id).delete();
}

export async function adminCreateMenuItem(
  restaurantId: string,
  input: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    badge?: string;
    tags?: string[];
    isAvailable?: boolean;
  },
): Promise<MenuItemRecord> {
  const existing = await adminListMenuItems(restaurantId);
  const timestamp = nowIso();
  const payload = {
    restaurantId,
    categoryId: input.categoryId,
    name: input.name.trim(),
    description: input.description ?? "",
    price: Number(input.price),
    imageUrl: "",
    tags: input.tags ?? [],
    badge: input.badge ?? "",
    isAvailable: input.isAvailable !== false,
    sortOrder: existing.length,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ref = await getAdminDb().collection(COLLECTIONS.menuItems).add(payload);
  return mapItem(ref.id, payload);
}

export async function adminUpdateMenuItem(
  id: string,
  input: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    badge?: string;
    tags?: string[];
    isAvailable?: boolean;
  },
): Promise<void> {
  await getAdminDb()
    .collection(COLLECTIONS.menuItems)
    .doc(id)
    .update({
      categoryId: input.categoryId,
      name: input.name.trim(),
      description: input.description ?? "",
      price: Number(input.price),
      tags: input.tags ?? [],
      badge: input.badge ?? "",
      isAvailable: input.isAvailable !== false,
      updatedAt: nowIso(),
    });
}

export async function adminDeleteMenuItem(id: string): Promise<void> {
  await getAdminDb().collection(COLLECTIONS.menuItems).doc(id).delete();
}

export async function adminOverviewStats() {
  const [owners, restaurants] = await Promise.all([
    adminListOwners(),
    adminListRestaurants(),
  ]);
  return {
    pendingApprovals: owners.filter((o) => o.accountStatus === "pending").length,
    suspendedOwners: owners.filter((o) => o.accountStatus === "suspended").length,
    totalOwners: owners.length,
    totalRestaurants: restaurants.length,
    publishedRestaurants: restaurants.filter((r) => r.status === "published")
      .length,
    recentRestaurants: restaurants.slice(0, 8),
  };
}
