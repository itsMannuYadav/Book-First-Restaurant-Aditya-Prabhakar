import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  adminDeleteMenuItem,
  adminUpdateMenuItem,
} from "@/lib/admin/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  badge: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { itemId } = await context.params;
    const body = patchSchema.parse(await request.json());
    await adminUpdateMenuItem(itemId, body);
    await writeAdminAuditLog({
      actor,
      action: "menuItem.update",
      targetType: "menuItem",
      targetId: itemId,
      meta: body,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { itemId } = await context.params;
    await adminDeleteMenuItem(itemId);
    await writeAdminAuditLog({
      actor,
      action: "menuItem.delete",
      targetType: "menuItem",
      targetId: itemId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
