import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { buildMenuCsv } from "@/lib/admin/csv-menu-shared";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const { adminListCategories, adminListMenuItems } = await import(
      "@/lib/admin/server"
    );
    const [categories, items] = await Promise.all([
      adminListCategories(id),
      adminListMenuItems(id),
    ]);
    const csv = buildMenuCsv(categories, items);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="menu-${id}.csv"`,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
