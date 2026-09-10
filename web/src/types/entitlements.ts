/**
 * Per-owner module access. An owner's account carries capability flags that
 * the admin sets; the dashboard nav, route guards, `proxy.ts`, and Firestore
 * rules all read from the same shape. Add a key here to introduce a new module.
 */
export type ModuleKey = "menu" | "orders" | "billing";

export type OwnerModules = Record<ModuleKey, boolean>;

/** Named bundles the admin picks from. `custom` = hand-tuned flags. */
export type ModulePreset = "core" | "billing_only" | "full" | "custom";
