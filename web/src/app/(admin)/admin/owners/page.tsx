"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reasonByUid, setReasonByUid] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ owners: UserProfile[] }>(
        "/api/admin/owners",
      );
      setOwners(data.owners);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to load owners",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void refresh();
  }, [refresh]);

  async function patchOwner(
    uid: string,
    accountStatus: "active" | "suspended" | "pending",
  ) {
    setPendingId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({
          accountStatus,
          suspendReason: reasonByUid[uid],
        }),
      });
      toast.success(`Owner marked ${accountStatus}`);
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
        title="Owners"
        description="Approve, suspend, or reinstate restaurant owner accounts."
      />

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {owners.map((owner) => (
            <li
              key={owner.uid}
              className="rounded-2xl border border-[#14110e]/8 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#14110e]">
                    {owner.displayName || "Owner"}
                  </p>
                  <p className="text-sm text-[#7a7164]">{owner.email}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#8a8173]">
                    {owner.accountStatus}
                  </p>
                  {owner.suspendReason ? (
                    <p className="mt-1 text-xs text-destructive">
                      {owner.suspendReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {owner.accountStatus !== "active" ? (
                    <button
                      type="button"
                      disabled={pendingId === owner.uid}
                      className={cn(buttonVariants({ size: "sm" }))}
                      onClick={() => void patchOwner(owner.uid, "active")}
                    >
                      Approve / reinstate
                    </button>
                  ) : null}
                  {owner.accountStatus !== "suspended" ? (
                    <button
                      type="button"
                      disabled={pendingId === owner.uid}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                      )}
                      onClick={() => void patchOwner(owner.uid, "suspended")}
                    >
                      Suspend
                    </button>
                  ) : null}
                </div>
              </div>
              {owner.accountStatus !== "suspended" ? (
                <Input
                  className="mt-3"
                  placeholder="Suspend reason (optional)"
                  value={reasonByUid[owner.uid] ?? ""}
                  onChange={(e) =>
                    setReasonByUid((prev) => ({
                      ...prev,
                      [owner.uid]: e.target.value,
                    }))
                  }
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
