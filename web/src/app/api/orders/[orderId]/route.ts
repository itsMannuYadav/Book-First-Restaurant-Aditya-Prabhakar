import { NextResponse } from "next/server";
import { getGuestOrder } from "@/lib/orders/place-order";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  if (!orderId || orderId.length > 128 || !token || token.length > 128) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Missing or invalid order credentials." },
      { status: 401 },
    );
  }

  try {
    const order = await getGuestOrder(orderId, token);
    if (!order) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Order not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[GET /api/orders/:id]", err);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Unable to load order status." },
      { status: 500 },
    );
  }
}
