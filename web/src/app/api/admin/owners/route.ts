import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const pendingOnly = searchParams.get("pending") === "1";
    const { adminListOwnersWithMeta, adminListPendingOwners } = await import(
      "@/lib/admin/server"
    );
    const owners = pendingOnly
      ? await adminListPendingOwners()
      : await adminListOwnersWithMeta();
    return NextResponse.json({ owners });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

const statusSchema = z.object({
  accountStatus: z.enum(["pending", "active", "suspended"]),
  suspendReason: z.string().optional(),
});

const bulkSchema = z.object({
  uids: z.array(z.string().min(1)).min(1).max(100),
  preset: z.enum(["core", "billing_only", "full"]),
});

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const raw = await request.json();
    const { adminPatchOwner } = await import("@/lib/admin/server");
    const { writeAdminAuditLog } = await import("@/lib/admin/audit");

    // Bulk plan change: { uids, preset }
    const bulk = bulkSchema.safeParse(raw);
    if (bulk.success) {
      const results = await Promise.allSettled(
        bulk.data.uids.map((uid) =>
          adminPatchOwner(uid, { preset: bulk.data.preset, actorEmail: actor.email }),
        ),
      );
      const updated = results.filter((r) => r.status === "fulfilled").length;
      await writeAdminAuditLog({
        actor,
        action: "owner.modules.bulk",
        targetType: "user",
        targetId: bulk.data.uids.join(","),
        meta: { preset: bulk.data.preset, updated, requested: bulk.data.uids.length },
      });
      return NextResponse.json({ updated, requested: bulk.data.uids.length });
    }

    // Single owner status change: ?uid=... { accountStatus, suspendReason }
    const body = statusSchema.parse(raw);
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json(
        { code: "VALIDATION", message: "uid query param is required." },
        { status: 400 },
      );
    }

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
