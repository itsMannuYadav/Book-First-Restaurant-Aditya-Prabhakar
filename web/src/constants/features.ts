/**
 * Logo uploads need Firebase Storage (Blaze plan).
 * Set NEXT_PUBLIC_LOGO_UPLOADS_ENABLED=true after Storage is enabled.
 */
export const LOGO_UPLOADS_ENABLED =
  process.env.NEXT_PUBLIC_LOGO_UPLOADS_ENABLED === "true";

export const LOGO_UPLOADS_UNAVAILABLE_MESSAGE =
  "Logo upload isn’t available yet. We’re finishing image storage setup — your menu still works with the letter mark for now. Check back soon.";
