import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    await requireAdmin(request);
    const { uid } = await context.params;
    const { adminGetOwnerDetail } = await import("@/lib/admin/server");
    const detail = await adminGetOwnerDetail(uid);
    if (!detail) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Owner not found." },
        { status: 404 },
      );
    }
    return NextResponse.json(detail);
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const patchSchema = z
  .object({
    accountStatus: z.enum(["pending", "active", "suspended"]).optional(),
    suspendReason: z.string().optional(),
    preset: z.enum(["core", "billing_only", "full", "custom"]).optional(),
    modules: z
      .object({
        menu: z.boolean(),
        orders: z.boolean(),
        billing: z.boolean(),
      })
      .partial()
      .optional(),
  })
  .refine(
    (v) =>
      v.accountStatus !== undefined ||
      v.preset !== undefined ||
      v.modules !== undefined,
    { message: "Nothing to update." },
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { uid } = await context.params;
    const body = patchSchema.parse(await request.json());
    const { adminPatchOwner } = await import("@/lib/admin/server");
    const { writeAdminAuditLog } = await import("@/lib/admin/audit");
    const owner = await adminPatchOwner(uid, {
      accountStatus: body.accountStatus,
      suspendReason: body.suspendReason,
      preset: body.preset,
      modules: body.modules,
      actorEmail: actor.email,
    });
    await writeAdminAuditLog({
      actor,
      action: body.accountStatus
        ? `owner.${body.accountStatus}`
        : "owner.modules",
      targetType: "user",
      targetId: uid,
      meta: {
        suspendReason: body.suspendReason,
        preset: body.preset,
        modules: body.modules,
        resultingModules: owner.modules,
      },
    });
    return NextResponse.json({ owner });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
