import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const pendingOnly = searchParams.get("pending") === "1";
    const { adminListOwners, adminListPendingOwners } = await import(
      "@/lib/admin/server"
    );
    const owners = pendingOnly
      ? await adminListPendingOwners()
      : await adminListOwners();
    return NextResponse.json({ owners });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const patchSchema = z.object({
  accountStatus: z.enum(["pending", "active", "suspended"]),
  suspendReason: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = patchSchema.parse(await request.json());
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json(
        { code: "VALIDATION", message: "uid query param is required." },
        { status: 400 },
      );
    }

    const { adminPatchOwner } = await import("@/lib/admin/server");
    const { writeAdminAuditLog } = await import("@/lib/admin/audit");

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
