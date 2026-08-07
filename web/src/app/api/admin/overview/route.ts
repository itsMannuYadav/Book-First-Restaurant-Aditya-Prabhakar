import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { adminOverviewStats } from "@/lib/admin/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const stats = await adminOverviewStats();
    return NextResponse.json(stats);
  } catch (err) {
    return adminErrorResponse(err);
  }
}
