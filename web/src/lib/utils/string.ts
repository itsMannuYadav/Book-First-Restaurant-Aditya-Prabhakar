export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Always-safe public menu slug (lowercase only). */
export function uniqueSlug(baseName: string, uniquePart: string): string {
  const base = slugify(baseName) || "restaurant";
  const suffix = slugify(uniquePart).slice(0, 8) || "menu";
  return `${base}-${suffix}`.slice(0, 60);
}

export function nowIso(): string {
  return new Date().toISOString();
}
