import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { importMenuCsv } from "@/lib/admin/csv-menu";

export const runtime = "nodejs";

const bodySchema = z.object({
  csvText: z.string().min(1),
  mode: z.enum(["append", "replace"]).default("append"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    const result = await importMenuCsv({
      restaurantId: id,
      csvText: body.csvText,
      mode: body.mode,
    });
    await writeAdminAuditLog({
      actor,
      action: "menu.import",
      targetType: "restaurant",
      targetId: id,
      meta: {
        mode: body.mode,
        createdItems: result.createdItems,
        createdCategories: result.createdCategories,
        deletedItems: result.deletedItems,
        errorCount: result.errors.length,
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return adminErrorResponse(err);
  }
}
