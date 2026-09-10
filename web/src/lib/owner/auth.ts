import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase/admin-env";
import { normalizeModules, resolveModules } from "@/constants/modules";
import type { ModuleKey, ModulePreset, OwnerModules } from "@/types";

export type OwnerActor = {
  uid: string;
  email: string;
  modules: OwnerModules;
  preset: ModulePreset;
};

export class OwnerAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "OwnerAuthError";
    this.status = status;
  }
}

/**
 * Verifies the caller's Firebase ID token (Bearer) and resolves their module
 * access from custom claims, falling back to the Firestore user doc when the
 * token predates an entitlement change.
 */
export async function requireOwner(request: Request): Promise<OwnerActor> {
  if (!isAdminConfigured()) {
    throw new OwnerAuthError(
      "Firebase Admin is not configured on the server.",
      503,
    );
  }

  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) {
    throw new OwnerAuthError("Missing Authorization bearer token.");
  }

  const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(match[1]);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "token error";
    throw new OwnerAuthError(`Invalid or expired auth token. (${detail})`);
  }

  const claimModules = decoded.modules as Partial<OwnerModules> | undefined;
  const claimPreset = decoded.preset as ModulePreset | undefined;

  let modules: OwnerModules;
  if (claimModules || claimPreset) {
    modules = resolveModules({ preset: claimPreset, modules: claimModules });
  } else {
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    modules = normalizeModules(
      snap.data()?.modules as Partial<OwnerModules> | undefined,
    );
  }

  return {
    uid: decoded.uid,
    email: decoded.email?.trim().toLowerCase() ?? "",
    modules,
    preset: (claimPreset as ModulePreset) ?? "custom",
  };
}

export async function requireOwnerModule(
  request: Request,
  key: ModuleKey,
): Promise<OwnerActor> {
  const actor = await requireOwner(request);
  if (actor.modules[key] !== true) {
    throw new OwnerAuthError(
      `The ${key} module is not enabled for your account.`,
      403,
    );
  }
  return actor;
}

export function ownerErrorResponse(err: unknown) {
  if (err instanceof OwnerAuthError) {
    return NextResponse.json(
      { code: "OWNER_AUTH", message: err.message },
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
      { code: "VALIDATION", message: issue?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  console.error("[owner api]", err);
  return NextResponse.json(
    {
      code: "OWNER_ERROR",
      message: err instanceof Error ? err.message : "Unexpected error.",
    },
    { status: 500 },
  );
}
