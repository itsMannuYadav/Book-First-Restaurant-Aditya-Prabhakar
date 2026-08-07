import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  adminCreateMenuItem,
  adminListMenuItems,
} from "@/lib/admin/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
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
