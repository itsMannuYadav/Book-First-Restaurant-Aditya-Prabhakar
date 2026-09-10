/** Firebase session-cookie name. Read by `proxy.ts` (edge) and the session route. */
export const SESSION_COOKIE = "__session";

/** Firebase session cookies last up to 14 days; we mirror that. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
