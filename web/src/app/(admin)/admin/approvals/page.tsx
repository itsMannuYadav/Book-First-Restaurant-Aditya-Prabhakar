"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

export default function AdminApprovalsPage() {
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ owners: UserProfile[] }>(
        "/api/admin/owners?pending=1",
      );
      setOwners(data.owners);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to load approvals",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void refresh();
  }, [refresh]);

  async function setStatus(uid: string, accountStatus: "active" | "pending") {
    setPendingId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ accountStatus }),
      });
      toast.success(
        accountStatus === "active" ? "Owner approved" : "Marked pending",
      );
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Update failed",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="New owners stay in draft until you approve them."
      />

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : owners.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[#14110e]/8 bg-white px-4 py-6 text-sm text-[#7a7164]">
          No pending approvals. Nice and clear.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[#14110e]/8 overflow-hidden rounded-2xl border border-[#14110e]/8 bg-white">
          {owners.map((owner) => (
            <li
              key={owner.uid}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
            >
              <div>
                <p className="font-medium text-[#14110e]">{owner.displayName}</p>
                <p className="text-sm text-[#7a7164]">{owner.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendingId === owner.uid}
                  className={cn(buttonVariants({ size: "sm" }))}
                  onClick={() => void setStatus(owner.uid, "active")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pendingId === owner.uid}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                  )}
                  onClick={() =>
                    void (async () => {
                      setPendingId(owner.uid);
                      try {
                        await adminFetch(`/api/admin/owners/${owner.uid}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            accountStatus: "suspended",
                            suspendReason: "Application rejected by team",
                          }),
                        });
                        toast.success("Application rejected");
                        await refresh();
                      } catch (err) {
                        toast.error(
                          err instanceof AdminApiError
                            ? err.message
                            : "Update failed",
                        );
                      } finally {
                        setPendingId(null);
                      }
                    })()
                  }
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
