import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin/emails";
import { isAdminConfigured } from "@/lib/firebase/admin-env";

export type AdminActor = {
  uid: string;
  email: string;
};

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

/**
 * Env checks first; firebase-admin loads only after a bearer token is present
 * (avoids Vercel boot crashes when the Admin SDK fails to load at import time).
 */
export async function requireAdmin(request: Request): Promise<AdminActor> {
  if (!isAdminConfigured()) {
    throw new AdminAuthError(
      "Firebase Admin is not configured on the server.",
      503,
    );
  }

  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) {
    throw new AdminAuthError("Missing Authorization bearer token.");
  }

  const { getAdminAuth } = await import("@/lib/firebase/admin");

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(match[1]);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "token error";
    throw new AdminAuthError(`Invalid or expired auth token. (${detail})`);
  }

  const email = decoded.email?.trim().toLowerCase() ?? "";
  if (!isAdminEmail(email)) {
    throw new AdminAuthError("Not authorized for the admin console.", 403);
  }

  return { uid: decoded.uid, email };
}

export function adminErrorResponse(err: unknown) {
  if (err instanceof AdminAuthError) {
    return NextResponse.json(
      { code: "ADMIN_AUTH", message: err.message },
      { status: err.status },
    );
  }
  if (
    err &&
    typeof err === "object" &&
    "name" in err &&
    (err as { name?: string }).name === "ZodError"
  ) {
    const issue = (err as { issues?: Array<{ message?: string }> }).issues?.[0];
    return NextResponse.json(
      {
        code: "VALIDATION",
        message: issue?.message ?? "Invalid request.",
      },
      { status: 400 },
    );
  }
  console.error("[admin api]", err);
  return NextResponse.json(
    {
      code: "ADMIN_ERROR",
      message: err instanceof Error ? err.message : "Unexpected admin error.",
    },
    { status: 500 },
  );
}
