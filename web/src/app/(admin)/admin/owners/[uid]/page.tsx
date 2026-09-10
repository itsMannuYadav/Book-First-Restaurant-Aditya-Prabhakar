"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { OwnerModulesEditor } from "@/features/admin/components/owner-modules-editor";
import type { OwnerModules, RestaurantApprovalStatus, RestaurantStatus, UserProfile } from "@/types";

type OwnerDetail = {
  owner: UserProfile;
  restaurants: Array<{
    id: string;
    name: string;
    slug: string;
    status: RestaurantStatus;
    approvalStatus: RestaurantApprovalStatus;
  }>;
};

export default function AdminOwnerDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [detail, setDetail] = useState<OwnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<OwnerDetail>(`/api/admin/owners/${uid}`);
      setDetail(data);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to load owner",
      );
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  async function patch(body: Record<string, unknown>, okMessage: string) {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(okMessage);
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl border border-[#14110e]/8 bg-white px-4 py-6 text-sm text-[#7a7164]">
          Owner not found.
        </p>
        <Link href={ROUTES.adminOwners} className="text-sm underline">
          Back to owners
        </Link>
      </div>
    );
  }

  const { owner, restaurants } = detail;

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.adminOwners}
        className="inline-flex items-center gap-1.5 text-sm text-[#8a8173] hover:text-[#14110e]"
      >
        <ArrowLeft className="size-4" />
        Owners
      </Link>

      <PageHeader
        title={owner.displayName || "Owner"}
        description={owner.email}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#8a8173]">
        <span className="rounded-full bg-[#14110e]/5 px-2.5 py-1 text-[#14110e]">
          {owner.accountStatus}
        </span>
        {owner.modulesUpdatedBy ? (
          <span>
            Access set by {owner.modulesUpdatedBy}
          </span>
        ) : null}
      </div>

      <OwnerModulesEditor
        modules={owner.modules}
        busy={busy}
        onApply={(next: OwnerModules) =>
          patch({ modules: next }, "Module access updated")
        }
      />

      <div className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#14110e]">Account</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {owner.accountStatus !== "active" ? (
            <button
              type="button"
              disabled={busy}
              className={cn(buttonVariants({ size: "sm" }))}
              onClick={() =>
                void patch({ accountStatus: "active" }, "Owner approved")
              }
            >
              Approve / reinstate
            </button>
          ) : null}
          {owner.accountStatus !== "suspended" ? (
            <button
              type="button"
              disabled={busy}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              onClick={() =>
                void patch(
                  { accountStatus: "suspended", suspendReason: reason },
                  "Owner suspended",
                )
              }
            >
              Suspend
            </button>
          ) : null}
        </div>
        {owner.accountStatus !== "suspended" ? (
          <Input
            className="mt-3"
            placeholder="Suspend reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        ) : owner.suspendReason ? (
          <p className="mt-3 text-xs text-destructive">{owner.suspendReason}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#14110e]">Restaurants</h2>
        {restaurants.length === 0 ? (
          <p className="mt-2 text-sm text-[#7a7164]">No restaurant yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {restaurants.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={ROUTES.adminRestaurant(r.id)}
                  className="font-medium text-[#14110e] underline underline-offset-2"
                >
                  {r.name}
                </Link>
                <span className="text-xs uppercase tracking-wide text-[#8a8173]">
                  {r.status} · {r.approvalStatus}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
