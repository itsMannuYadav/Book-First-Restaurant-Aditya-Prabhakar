import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
    const cursor = searchParams.get("cursor");

    const { getAdminDb } = await import("@/lib/firebase/admin");
    const { COLLECTIONS } = await import("@/lib/firebase/collections");

    const db = getAdminDb();
    let q = db
      .collection(COLLECTIONS.adminAuditLogs)
      .orderBy("createdAt", "desc")
      .limit(limit + 1);

    if (cursor) {
      q = q.where("createdAt", "<", cursor);
    }

    const snap = await q.get();
    const hasMore = snap.docs.length > limit;
    const docs = snap.docs.slice(0, limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Batch-enrich user-targeted events with the owner's name and email so the
    // logs page can show something human-readable instead of a raw Firestore UID.
    const userIds = [
      ...new Set(
        logs
          .filter((l) => l.targetType === "user" && typeof l.targetId === "string")
          .map((l) => l.targetId as string),
      ),
    ];

    if (userIds.length > 0) {
      const refs = userIds.map((uid) => db.collection(COLLECTIONS.users).doc(uid));
      const userSnaps = await db.getAll(...refs);
      const userMap: Record<string, { email: string; displayName: string }> = {};
      for (const userSnap of userSnaps) {
        if (userSnap.exists) {
          const d = userSnap.data()!;
          userMap[userSnap.id] = {
            email: String(d.email ?? ""),
            displayName: String(d.displayName ?? ""),
          };
        }
      }
      for (const log of logs) {
        if (log.targetType === "user" && userMap[log.targetId]) {
          log.targetEmail = userMap[log.targetId].email;
          log.targetDisplayName = userMap[log.targetId].displayName;
        }
      }
    }

    const nextCursor = hasMore
      ? (docs[docs.length - 1].data().createdAt as string)
      : null;

    return NextResponse.json({ logs, nextCursor, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
