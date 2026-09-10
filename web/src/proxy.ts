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
 */

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
  if (!MATCHED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.next();

  const claims = decodeClaims(cookie);
  if (!claims || (!claims.modules && !claims.preset)) return NextResponse.next();

  // Admins carry no owner modules — never redirect them here.
  const raw = claims as { admin?: boolean; role?: string };
  if (raw.admin || raw.role === "admin") return NextResponse.next();

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
