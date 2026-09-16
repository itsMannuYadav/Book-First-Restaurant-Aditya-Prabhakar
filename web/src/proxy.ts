import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/constants/auth";
import {
  moduleForPath,
  moduleHome,
  resolveModules,
} from "@/constants/modules";
import type { ModulePreset, OwnerModules } from "@/types";

/**
 * Optimistic edge guard. Decodes the Firebase session cookie WITHOUT verifying
 * (verification needs the Admin SDK, which can't run on the edge) and redirects
 * owners away from modules their claims don't include. Real enforcement lives in
 * Firestore rules, the API-route guards, and the client `ModuleGuard`.
 *
 * Also redirects already-logged-in users away from the homepage and auth pages
 * so they land straight in their workspace.
 */

/** Public pages that a logged-in user should leave immediately. */
const GUEST_ONLY = ["/", "/login", "/signup"];

const MATCHED_PREFIXES = [
  "/dashboard",
  "/orders",
  "/billing",
  "/restaurant",
  "/categories",
  "/menu-items",
  "/themes",
  "/qr",
];

function decodeClaims(
  token: string,
): { modules?: Partial<OwnerModules>; preset?: ModulePreset } | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const json = atob(base64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGuestOnly = GUEST_ONLY.includes(pathname);
  const isDashboardPath = MATCHED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isGuestOnly && !isDashboardPath) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.next();

  const claims = decodeClaims(cookie);
  if (!claims) return NextResponse.next();

  const raw = claims as { admin?: boolean; role?: string };
  const isAdmin = raw.admin === true || raw.role === "admin";

  // --- Logged-in user on homepage / auth pages → send to their workspace ---
  if (isGuestOnly) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (claims.modules || claims.preset) {
      const modules = resolveModules({
        preset: claims.preset,
        modules: claims.modules,
      });
      return NextResponse.redirect(new URL(moduleHome(modules), request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Dashboard paths: admins pass through, owners get module-guarded ---
  if (isAdmin) return NextResponse.next();
  if (!claims.modules && !claims.preset) return NextResponse.next();

  const modules = resolveModules({ preset: claims.preset, modules: claims.modules });
  const required = moduleForPath(pathname);
  const home = moduleHome(modules);

  const denied =
    (required !== null && modules[required] !== true) ||
    (pathname === "/dashboard" && home !== "/dashboard");

  if (denied && pathname !== home) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/orders/:path*",
    "/billing/:path*",
    "/restaurant/:path*",
    "/categories/:path*",
    "/menu-items/:path*",
    "/themes/:path*",
    "/qr/:path*",
  ],
};
