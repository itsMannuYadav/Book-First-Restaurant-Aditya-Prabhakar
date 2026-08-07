import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { getAdminEmails } from "@/lib/admin/emails";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(request);
    return NextResponse.json({
      ok: true,
      email: actor.email,
      uid: actor.uid,
      allowlistConfigured: getAdminEmails().length > 0,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
