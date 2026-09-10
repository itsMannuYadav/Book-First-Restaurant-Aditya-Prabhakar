import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured } from "@/lib/firebase/admin-env";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/constants/auth";

export const runtime = "nodejs";

const bodySchema = z.object({ idToken: z.string().min(20) });

function cookieOptions(maxAge: number) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    // No Admin SDK — `proxy.ts` simply has nothing to read; that's fine.
    return NextResponse.json({ ok: false, reason: "admin-not-configured" });
  }

  try {
    const { idToken } = bodySchema.parse(await request.json());
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const auth = getAdminAuth();

    // Reject early if the ID token itself is bad.
    await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({ ...cookieOptions(SESSION_MAX_AGE_SECONDS), value: sessionCookie });
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create a session.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...cookieOptions(0), value: "" });
  return res;
}
