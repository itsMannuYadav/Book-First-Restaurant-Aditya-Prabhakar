import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { adminOverviewStats } = await import("@/lib/admin/server");
    const stats = await adminOverviewStats();
    return NextResponse.json(stats);
  } catch (err) {
    return adminErrorResponse(err);
  }
}
