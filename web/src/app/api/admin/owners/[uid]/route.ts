import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { adminPatchOwner } from "@/lib/admin/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  accountStatus: z.enum(["pending", "active", "suspended"]),
  suspendReason: z.string().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    const actor = await requireAdmin(request);
    const { uid } = await context.params;
    const body = patchSchema.parse(await request.json());
    const owner = await adminPatchOwner(uid, {
      accountStatus: body.accountStatus,
      suspendReason: body.suspendReason,
      actorEmail: actor.email,
    });
    await writeAdminAuditLog({
      actor,
      action: `owner.${body.accountStatus}`,
      targetType: "user",
      targetId: uid,
      meta: { suspendReason: body.suspendReason },
    });
    return NextResponse.json({ owner });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
