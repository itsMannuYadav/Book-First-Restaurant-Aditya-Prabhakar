import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
    const cursor = searchParams.get("cursor"); // ISO datetime — fetch entries older than this

    const { getAdminDb } = await import("@/lib/firebase/admin");
    const { COLLECTIONS } = await import("@/lib/firebase/collections");

    const db = getAdminDb();
    let q = db
      .collection(COLLECTIONS.adminAuditLogs)
      .orderBy("createdAt", "desc")
      .limit(limit + 1); // +1 to detect whether a next page exists

    if (cursor) {
      q = q.where("createdAt", "<", cursor);
    }

    const snap = await q.get();
    const hasMore = snap.docs.length > limit;
    const docs = snap.docs.slice(0, limit);

    const logs = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor = hasMore
      ? (docs[docs.length - 1].data().createdAt as string)
      : null;

    return NextResponse.json({
      logs,
      nextCursor,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
