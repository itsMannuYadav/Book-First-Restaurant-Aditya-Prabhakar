import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { adminListRestaurants } from "@/lib/admin/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? undefined;
    const restaurants = await adminListRestaurants(search);
    return NextResponse.json({ restaurants });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
