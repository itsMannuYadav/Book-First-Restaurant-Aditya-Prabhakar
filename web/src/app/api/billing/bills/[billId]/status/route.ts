import { NextResponse } from "next/server";
import { z } from "zod";
import { ownerErrorResponse, requireOwnerModule } from "@/lib/owner/auth";

export const runtime = "nodejs";

const bodySchema = z.object({ status: z.enum(["paid", "void"]) });

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const actor = await requireOwnerModule(request, "billing");
    const { billId } = await context.params;
    const body = bodySchema.parse(await request.json());
    const { setBillStatus } = await import("@/lib/owner/bill-server");
    const bill = await setBillStatus(billId, actor, body.status);
    return NextResponse.json({ bill });
  } catch (err) {
    return ownerErrorResponse(err);
  }
}
