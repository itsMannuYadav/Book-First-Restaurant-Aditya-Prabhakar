import type { User } from "firebase/auth";

/**
 * Keeps a server-readable Firebase session cookie in step with the client auth
 * state, so `proxy.ts` can do optimistic module redirects. Best-effort: any
 * failure is swallowed because the client `ModuleGuard` + Firestore rules are
 * the real enforcement.
 */
export async function syncSessionCookie(user: User): Promise<void> {
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      keepalive: true,
    });
  } catch {
    // ignore — optimistic layer only
  }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE", keepalive: true });
  } catch {
    // ignore
  }
}
