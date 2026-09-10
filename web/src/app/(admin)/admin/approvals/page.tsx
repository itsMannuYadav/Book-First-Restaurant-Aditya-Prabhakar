"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  MODULE_PRESETS,
  detectPreset,
} from "@/constants/modules";
import { PresetPicker } from "@/features/admin/components/preset-picker";
import { cn } from "@/lib/utils";
import type { ModulePreset, OwnerModules, UserProfile } from "@/types";

function grantsCaption(modules: OwnerModules): string {
  const on = MODULE_KEYS.filter((k) => modules[k]).map((k) => MODULE_LABELS[k]);
  return on.length ? `Grants: ${on.join(", ")}` : "Grants nothing";
}

export default function AdminApprovalsPage() {
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [presetByUid, setPresetByUid] = useState<Record<string, ModulePreset>>({});

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

  function modulesFor(uid: string): OwnerModules {
    return MODULE_PRESETS[presetByUid[uid] === "billing_only"
      ? "billing_only"
      : presetByUid[uid] === "full"
        ? "full"
        : "core"];
  }

  async function approve(uid: string) {
    setPendingId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({
          accountStatus: "active",
          preset: presetByUid[uid] ?? "core",
        }),
      });
      toast.success("Owner approved");
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function reject(uid: string) {
    setPendingId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({
          accountStatus: "suspended",
          suspendReason: "Application rejected by team",
        }),
      });
      toast.success("Application rejected");
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="New owners stay in draft until you approve them — pick their plan here."
      />

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : owners.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[#14110e]/8 bg-white px-4 py-6 text-sm text-[#7a7164]">
          No pending approvals. Nice and clear.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {owners.map((owner) => {
            const modules = modulesFor(owner.uid);
            const busy = pendingId === owner.uid;
            return (
              <li
                key={owner.uid}
                className="rounded-2xl border border-[#14110e]/8 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#14110e]">
                      {owner.displayName}
                    </p>
                    <p className="text-sm text-[#7a7164]">{owner.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(buttonVariants({ size: "sm" }))}
                      onClick={() => void approve(owner.uid)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                        "border-destructive/30 text-destructive",
                      )}
                      onClick={() => void reject(owner.uid)}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#14110e]/8 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
                    Plan on approval
                  </p>
                  <div className="mt-1.5">
                    <PresetPicker
                      compact
                      disabled={busy}
                      modules={modules}
                      onChange={(m) =>
                        setPresetByUid((prev) => ({
                          ...prev,
                          [owner.uid]: detectPreset(m),
                        }))
                      }
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#8a8173]">
                    {grantsCaption(modules)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
