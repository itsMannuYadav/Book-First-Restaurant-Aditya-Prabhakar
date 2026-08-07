import { NextResponse } from "next/server";
import { adminEnvDiagnostics } from "@/lib/firebase/admin-env";

export const runtime = "nodejs";

/**
 * Lightweight diagnostics for Vercel — does not import firebase-admin.
 */
export async function GET() {
  const env = adminEnvDiagnostics();
  let adminSdkLoad: "ok" | "error" = "ok";
  let adminSdkError: string | null = null;
  let adminInit: "skipped" | "ok" | "error" = "skipped";
  let adminInitError: string | null = null;

  try {
    await import("firebase-admin/app");
  } catch (err) {
    adminSdkLoad = "error";
    adminSdkError = err instanceof Error ? err.message : String(err);
  }

  if (adminSdkLoad === "ok" && env.adminConfigured) {
    try {
      const { getAdminApp } = await import("@/lib/firebase/admin");
      getAdminApp();
      adminInit = "ok";
    } catch (err) {
      adminInit = "error";
      adminInitError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    ok: adminSdkLoad === "ok" && (adminInit === "ok" || adminInit === "skipped"),
    env,
    adminSdkLoad,
    adminSdkError,
    adminInit,
    adminInitError,
  });
}
