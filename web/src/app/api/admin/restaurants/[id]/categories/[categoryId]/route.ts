import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  adminDeleteCategory,
  adminUpdateCategory,
} from "@/lib/admin/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  description: z.string().optional(),
  isVisible: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; categoryId: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { categoryId } = await context.params;
    const body = patchSchema.parse(await request.json());
    await adminUpdateCategory(categoryId, body);
    await writeAdminAuditLog({
      actor,
      action: "category.update",
      targetType: "category",
      targetId: categoryId,
      meta: body,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; categoryId: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { categoryId } = await context.params;
    await adminDeleteCategory(categoryId);
    await writeAdminAuditLog({
      actor,
      action: "category.delete",
      targetType: "category",
      targetId: categoryId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
