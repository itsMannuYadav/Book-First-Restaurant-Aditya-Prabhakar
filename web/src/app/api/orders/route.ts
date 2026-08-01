import { NextResponse } from "next/server";
import {
  placeOrder,
  placeOrderBodySchema,
} from "@/lib/orders/place-order";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32_768;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);
  return "unknown";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { code: "PAYLOAD_TOO_LARGE", message: "Request is too large." },
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { code: "PAYLOAD_TOO_LARGE", message: "Request is too large." },
        { status: 413 },
      );
    }
    json = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = placeOrderBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Invalid order request.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await placeOrder(parsed.data, clientIp(request));
    if (!result.ok) {
      return NextResponse.json(
        {
          code: result.code,
          message: result.message,
          ...(result.meta ? { meta: result.meta } : {}),
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      orderId: result.orderId,
      accessToken: result.accessToken,
      shortCode: result.shortCode,
      total: result.total,
      currency: result.currency,
    });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json(
      {
        code: "SERVER_ERROR",
        message: "Something went wrong placing your order. Please try again.",
      },
      { status: 500 },
    );
  }
}
