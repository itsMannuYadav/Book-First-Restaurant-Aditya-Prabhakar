import { NextResponse } from "next/server";
import { ownerErrorResponse, requireOwnerModule } from "@/lib/owner/auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const actor = await requireOwnerModule(request, "billing");
    const { billId } = await context.params;
    const { finalizeBill } = await import("@/lib/owner/bill-server");
    const bill = await finalizeBill(billId, actor);
    return NextResponse.json({ bill });
  } catch (err) {
    return ownerErrorResponse(err);
  }
}
