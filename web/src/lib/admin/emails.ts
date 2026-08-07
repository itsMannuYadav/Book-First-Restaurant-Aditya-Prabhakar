/**
 * Admin allowlist. Prefer ADMIN_EMAILS on the server; set
 * NEXT_PUBLIC_ADMIN_EMAILS too so the client can skip owner workspace
 * creation and route team logins to /admin.
 */
export function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.trim() ||
    "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}
