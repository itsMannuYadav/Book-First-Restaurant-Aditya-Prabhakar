import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  adminCreateCategory,
  adminListCategories,
} from "@/lib/admin/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const categories = await adminListCategories(id);
    return NextResponse.json({ categories });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  description: z.string().optional(),
  isVisible: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { id } = await context.params;
    const body = createSchema.parse(await request.json());
    const category = await adminCreateCategory(id, body);
    await writeAdminAuditLog({
      actor,
      action: "category.create",
      targetType: "category",
      targetId: category.id,
      meta: { restaurantId: id, name: category.name },
    });
    return NextResponse.json({ category });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
