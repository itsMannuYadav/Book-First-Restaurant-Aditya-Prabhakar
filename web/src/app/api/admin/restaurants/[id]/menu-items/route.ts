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
    const { adminListMenuItems } = await import("@/lib/admin/server");
    const items = await adminListMenuItems(id);
    return NextResponse.json({ items });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  badge: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { id } = await context.params;
    const body = createSchema.parse(await request.json());
    const { adminCreateMenuItem } = await import("@/lib/admin/server");
    const { writeAdminAuditLog } = await import("@/lib/admin/audit");
    const item = await adminCreateMenuItem(id, body);
    await writeAdminAuditLog({
      actor,
      action: "menuItem.create",
      targetType: "menuItem",
      targetId: item.id,
      meta: { restaurantId: id, name: item.name },
    });
    return NextResponse.json({ item });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
