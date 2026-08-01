import { z } from "zod";
import { createHash } from "crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  DEFAULT_ORDER_GEO_RADIUS_METERS,
  MAX_GPS_ACCURACY_METERS,
  MAX_GUEST_NOTE_LENGTH,
  MAX_ORDER_LINE_ITEMS,
  MAX_QTY_PER_LINE,
  ORDER_IDEMPOTENCY_TTL_MS,
  ORDER_RATE_LIMIT_MAX,
  ORDER_RATE_LIMIT_WINDOW_MS,
} from "@/constants/orders";
import {
  geoBucket,
  haversineDistanceMeters,
  isValidLatLng,
} from "@/lib/geo/distance";
import { checkRateLimit, pruneRateLimitBuckets } from "@/lib/orders/rate-limit";
import {
  createAccessToken,
  createShortCode,
  hashAccessToken,
  tokensMatch,
} from "@/lib/orders/tokens";
import { nowIso } from "@/lib/utils/string";
import type {
  GuestOrderView,
  Order,
  OrderLineItem,
  OrderStatus,
  RestaurantTable,
} from "@/types";

export const placeOrderBodySchema = z.object({
  restaurantId: z.string().min(1).max(128),
  tableId: z.string().min(1).max(64),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
      }),
    )
    .min(1)
    .max(MAX_ORDER_LINE_ITEMS),
  guestNote: z.string().max(MAX_GUEST_NOTE_LENGTH).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  accuracyMeters: z.number().positive().optional(),
  idempotencyKey: z.string().min(8).max(128),
  /** Honeypot — bots fill this; humans leave it empty. */
  website: z.string().max(200).optional(),
});

export type PlaceOrderBody = z.infer<typeof placeOrderBodySchema>;

export type PlaceOrderErrorCode =
  | "ADMIN_NOT_CONFIGURED"
  | "HONEYPOT"
  | "RATE_LIMITED"
  | "INVALID_LOCATION"
  | "GPS_INACCURATE"
  | "RESTAURANT_NOT_FOUND"
  | "ORDERING_DISABLED"
  | "NOT_PUBLISHED"
  | "NO_LOCATION"
  | "TOO_FAR"
  | "INVALID_TABLE"
  | "INVALID_ITEMS"
  | "IDEMPOTENCY_REPLAY";

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      accessToken: string;
      shortCode: string;
      total: number;
      currency: string;
    }
  | {
      ok: false;
      status: number;
      code: PlaceOrderErrorCode;
      message: string;
      meta?: Record<string, number | string>;
    };

function mapGuestView(id: string, data: DocumentData): GuestOrderView {
  return {
    id,
    shortCode: String(data.shortCode ?? ""),
    tableLabel: String(data.tableLabel ?? ""),
    items: (data.items as OrderLineItem[]) ?? [],
    currency: String(data.currency ?? "₹"),
    total: Number(data.total ?? 0),
    status: data.status as OrderStatus,
    guestNote: data.guestNote ? String(data.guestNote) : undefined,
    ownerNote: data.ownerNote ? String(data.ownerNote) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function placeOrder(
  body: PlaceOrderBody,
  clientIp: string,
): Promise<PlaceOrderResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      status: 503,
      code: "ADMIN_NOT_CONFIGURED",
      message:
        "Ordering is temporarily unavailable. The restaurant can still take your request at the counter.",
    };
  }

  // Bots that autofill hidden fields.
  if (body.website !== undefined && body.website.length > 0) {
    return {
      ok: false,
      status: 400,
      code: "HONEYPOT",
      message: "Unable to place order.",
    };
  }

  pruneRateLimitBuckets();

  const rateKeys = [`ip:${clientIp}`, `restaurant:${body.restaurantId}`];
  if (
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    isValidLatLng(body.lat, body.lng)
  ) {
    rateKeys.push(`geo:${geoBucket(body.lat, body.lng)}`);
  }

  for (const key of rateKeys) {
    const limited = checkRateLimit(
      key,
      ORDER_RATE_LIMIT_MAX,
      ORDER_RATE_LIMIT_WINDOW_MS,
    );
    if (!limited.ok) {
      return {
        ok: false,
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many order attempts. Please wait a few minutes and try again.",
        meta: { retryAfterMs: limited.retryAfterMs },
      };
    }
  }

  const db = getAdminDb();
  const restaurantRef = db.collection(COLLECTIONS.restaurants).doc(body.restaurantId);
  const restaurantSnap = await restaurantRef.get();

  if (!restaurantSnap.exists) {
    return {
      ok: false,
      status: 404,
      code: "RESTAURANT_NOT_FOUND",
      message: "Restaurant not found.",
    };
  }

  const restaurant = restaurantSnap.data()!;
  const status = String(restaurant.status ?? "draft");
  const orderingEnabled = Boolean(restaurant.orderingEnabled);
  const requireGuestGps = restaurant.requireGuestGps !== false;
  const location = restaurant.location as { lat?: number; lng?: number } | undefined;
  const radius =
    typeof restaurant.orderGeoRadiusMeters === "number"
      ? restaurant.orderGeoRadiusMeters
      : DEFAULT_ORDER_GEO_RADIUS_METERS;
  const tables = (restaurant.tables as RestaurantTable[] | undefined) ?? [];
  const currency = String(restaurant.currency ?? "₹");

  if (status !== "published") {
    return {
      ok: false,
      status: 403,
      code: "NOT_PUBLISHED",
      message: "This restaurant isn’t accepting online orders right now.",
    };
  }

  if (!orderingEnabled) {
    return {
      ok: false,
      status: 403,
      code: "ORDERING_DISABLED",
      message: "Dine-in ordering isn’t enabled for this restaurant yet.",
    };
  }

  let guestLocation: Order["guestLocation"];

  if (requireGuestGps) {
    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number" ||
      typeof body.accuracyMeters !== "number"
    ) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_LOCATION",
        message: "Location is required to place a dine-in order here.",
      };
    }

    if (!isValidLatLng(body.lat, body.lng)) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_LOCATION",
        message: "Your location looks invalid. Please try again.",
      };
    }

    if (body.accuracyMeters > MAX_GPS_ACCURACY_METERS) {
      return {
        ok: false,
        status: 400,
        code: "GPS_INACCURATE",
        message:
          "Your GPS signal isn’t clear enough. Step closer to a window or outdoors and try again.",
        meta: {
          accuracyMeters: body.accuracyMeters,
          max: MAX_GPS_ACCURACY_METERS,
        },
      };
    }

    if (
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number" ||
      !isValidLatLng(location.lat, location.lng)
    ) {
      return {
        ok: false,
        status: 403,
        code: "NO_LOCATION",
        message: "Ordering isn’t set up yet. Please ask staff for help.",
      };
    }

    const distanceMeters = haversineDistanceMeters(
      { lat: body.lat, lng: body.lng },
      { lat: location.lat, lng: location.lng },
    );

    if (distanceMeters > radius) {
      return {
        ok: false,
        status: 403,
        code: "TOO_FAR",
        message: "You need to be at the restaurant to place a dine-in order.",
        meta: {
          distanceMeters: Math.round(distanceMeters),
          radiusMeters: radius,
        },
      };
    }

    guestLocation = {
      lat: body.lat,
      lng: body.lng,
      accuracyMeters: body.accuracyMeters,
      distanceMeters: Math.round(distanceMeters),
    };
  } else if (
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    typeof body.accuracyMeters === "number" &&
    isValidLatLng(body.lat, body.lng)
  ) {
    // Optional soft capture when GPS is not required.
    const distanceMeters =
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number" &&
      isValidLatLng(location.lat, location.lng)
        ? Math.round(
            haversineDistanceMeters(
              { lat: body.lat, lng: body.lng },
              { lat: location.lat, lng: location.lng },
            ),
          )
        : -1;
    guestLocation = {
      lat: body.lat,
      lng: body.lng,
      accuracyMeters: body.accuracyMeters,
      distanceMeters,
    };
  }

  const table = tables.find((t) => t.id === body.tableId && t.isActive);
  if (!table) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_TABLE",
      message: "Please choose a valid table or seat.",
    };
  }

  // Idempotency via doc id — no composite index required.
  const idempotencyId = createHash("sha256")
    .update(`${body.restaurantId}:${body.idempotencyKey}`)
    .digest("hex");
  const idempotencyRef = db
    .collection(COLLECTIONS.orderIdempotency)
    .doc(idempotencyId);
  const idempotencySnap = await idempotencyRef.get();

  if (idempotencySnap.exists) {
    const data = idempotencySnap.data()!;
    const createdAt = Date.parse(String(data.createdAt ?? ""));
    if (
      Number.isFinite(createdAt) &&
      Date.now() - createdAt < ORDER_IDEMPOTENCY_TTL_MS
    ) {
      return {
        ok: false,
        status: 409,
        code: "IDEMPOTENCY_REPLAY",
        message:
          "This order was already submitted. Check your order ticket on this device.",
        meta: { orderId: String(data.orderId ?? "") },
      };
    }
  }

  // Re-load menu items and recompute totals server-side.
  const itemIds = [...new Set(body.items.map((i) => i.id))];
  const itemSnaps = await Promise.all(
    itemIds.map((id) => db.collection(COLLECTIONS.menuItems).doc(id).get()),
  );

  const itemById = new Map<string, DocumentData>();
  for (const snap of itemSnaps) {
    if (!snap.exists) continue;
    const data = snap.data()!;
    if (data.restaurantId !== body.restaurantId) continue;
    if (data.isAvailable === false) continue;
    itemById.set(snap.id, data);
  }

  const qtyById = new Map<string, number>();
  for (const line of body.items) {
    qtyById.set(line.id, (qtyById.get(line.id) ?? 0) + line.quantity);
  }

  const orderItems: OrderLineItem[] = [];
  let total = 0;

  for (const [id, quantity] of qtyById) {
    if (quantity > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_ITEMS",
        message: "One of the item quantities is too high.",
      };
    }
    const data = itemById.get(id);
    if (!data) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_ITEMS",
        message:
          "Some items are no longer available. Refresh the menu and try again.",
      };
    }
    const price = Number(data.price ?? 0);
    const name = String(data.name ?? "Item");
    orderItems.push({ id, name, price, quantity });
    total += price * quantity;
  }

  if (orderItems.length === 0) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_ITEMS",
      message: "Add at least one available item to order.",
    };
  }

  const accessToken = createAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);
  const shortCode = createShortCode();
  const timestamp = nowIso();
  const guestNote = body.guestNote?.trim() || undefined;

  const orderRef = db.collection(COLLECTIONS.orders).doc();
  const payload: Omit<Order, "id"> = {
    restaurantId: body.restaurantId,
    shortCode,
    tableId: table.id,
    tableLabel: table.label,
    items: orderItems,
    currency,
    total,
    status: "pending",
    guestNote,
    ...(guestLocation ? { guestLocation } : {}),
    accessTokenHash,
    clientIdempotencyKey: body.idempotencyKey,
    createdAt: timestamp,
    updatedAt: timestamp,
    statusHistory: [{ status: "pending", at: timestamp }],
  };

  const batch = db.batch();
  batch.set(orderRef, payload);
  batch.set(idempotencyRef, {
    orderId: orderRef.id,
    restaurantId: body.restaurantId,
    createdAt: timestamp,
  });
  await batch.commit();

  return {
    ok: true,
    orderId: orderRef.id,
    accessToken,
    shortCode,
    total,
    currency,
  };
}

export async function getGuestOrder(
  orderId: string,
  token: string,
): Promise<GuestOrderView | null> {
  if (!isAdminConfigured()) return null;
  if (!orderId || !token) return null;

  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.orders).doc(orderId).get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  const hash = String(data.accessTokenHash ?? "");
  if (!tokensMatch(token, hash)) return null;

  return mapGuestView(snap.id, data);
}
