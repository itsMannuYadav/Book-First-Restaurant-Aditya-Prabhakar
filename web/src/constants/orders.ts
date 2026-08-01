/** Default geofence radius around the restaurant pin (meters). */
export const DEFAULT_ORDER_GEO_RADIUS_METERS = 120;

/** Reject GPS fixes coarser than this (meters). */
export const MAX_GPS_ACCURACY_METERS = 80;

/** How long to wait for a usable GPS fix before timing out. */
export const GPS_FIX_TIMEOUT_MS = 20_000;

/** Keep listening for a clearer fix up to this duration. */
export const GPS_ACCURACY_WAIT_MS = 12_000;

export const MAX_ORDER_LINE_ITEMS = 40;
export const MAX_QTY_PER_LINE = 30;
export const MAX_GUEST_NOTE_LENGTH = 200;

/** Rate limit: max order creates per key in the window. */
export const ORDER_RATE_LIMIT_MAX = 5;
export const ORDER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export const ORDER_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export const GUEST_ORDER_POLL_MS = 3000;
