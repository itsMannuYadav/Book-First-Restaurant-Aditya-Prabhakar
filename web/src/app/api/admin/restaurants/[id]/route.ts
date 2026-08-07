import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const { adminGetRestaurant } = await import("@/lib/admin/server");
    const restaurant = await adminGetRestaurant(id);
    if (!restaurant) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Restaurant not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ restaurant });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  timing: z.string().optional(),
  currency: z.string().optional(),
  theme: z.enum(["dark", "rustic", "minimal", "savan"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  orderingEnabled: z.boolean().optional(),
  requireGuestGps: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());
    const { adminPatchRestaurant } = await import("@/lib/admin/server");
    const { writeAdminAuditLog } = await import("@/lib/admin/audit");
    const restaurant = await adminPatchRestaurant(id, body);
    await writeAdminAuditLog({
      actor,
      action: "restaurant.update",
      targetType: "restaurant",
      targetId: id,
      meta: body,
    });
    return NextResponse.json({ restaurant });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
