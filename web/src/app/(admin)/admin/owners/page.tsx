"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { ROUTES } from "@/constants/routes";
import { PRESET_LABELS, detectPreset } from "@/constants/modules";
import { cn } from "@/lib/utils";
import { PresetPicker } from "@/features/admin/components/preset-picker";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type {
  AccountStatus,
  AdminOwnerListItem,
  ModulePreset,
  OwnerModules,
} from "@/types";

type StatusFilter = "all" | AccountStatus;
type PlanFilter = "all" | ModulePreset;

const STATUS_TABS: StatusFilter[] = ["all", "pending", "active", "suspended"];
const PLAN_OPTIONS: PlanFilter[] = [
  "all",
  "core",
  "billing_only",
  "full",
  "custom",
];

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<AdminOwnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [confirm, setConfirm] = useState<
    | { kind: "single"; uid: string; name: string; modules: OwnerModules }
    | { kind: "bulk"; preset: Exclude<ModulePreset, "custom"> }
    | null
  >(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ owners: AdminOwnerListItem[] }>(
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p && PLAN_OPTIONS.includes(p as PlanFilter)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seed filter from the deep link
      setPlan(p as PlanFilter);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return owners.filter((o) => {
      if (status !== "all" && o.accountStatus !== status) return false;
      if (plan !== "all" && o.modulePreset !== plan) return false;
      if (
        q &&
        !o.displayName.toLowerCase().includes(q) &&
        !o.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [owners, status, plan, search]);

  const selectedInView = filtered.filter((o) => selected.has(o.uid));
  const allInViewSelected =
    filtered.length > 0 && selectedInView.length === filtered.length;

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allInViewSelected) filtered.forEach((o) => next.delete(o.uid));
      else filtered.forEach((o) => next.add(o.uid));
      return next;
    });
  }

  function toggleOne(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function applySingle(uid: string, modules: OwnerModules) {
    setBusyId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ modules }),
      });
      toast.success("Access updated");
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  function onRowPlanChange(owner: AdminOwnerListItem, modules: OwnerModules) {
    if (owner.accountStatus === "active") {
      setConfirm({
        kind: "single",
        uid: owner.uid,
        name: owner.displayName || owner.email,
        modules,
      });
    } else {
      void applySingle(owner.uid, modules);
    }
  }

  async function quickStatus(uid: string, accountStatus: AccountStatus) {
    setBusyId(uid);
    try {
      await adminFetch(`/api/admin/owners/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ accountStatus }),
      });
      toast.success(`Owner ${accountStatus}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function applyBulk(preset: Exclude<ModulePreset, "custom">) {
    const uids = [...selected];
    setBusyId("__bulk__");
    try {
      const res = await adminFetch<{ updated: number; requested: number }>(
        "/api/admin/owners",
        { method: "PATCH", body: JSON.stringify({ uids, preset }) },
      );
      toast.success(`Updated ${res.updated} of ${res.requested} owners`);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Bulk update failed");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Owners"
        description="Approve, suspend, and set module access for restaurant owners."
      />

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                status === tab
                  ? "bg-[#14110e] text-[#f4efe6]"
                  : "bg-white text-[#5c554a] hover:bg-[#14110e]/5",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanFilter)}
          className="h-8 rounded-lg border border-[#14110e]/15 bg-white px-2 text-xs text-[#5c554a]"
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? "All plans" : PRESET_LABELS[p]}
            </option>
          ))}
        </select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="h-8 w-full max-w-xs"
        />
      </div>

      {/* bulk toolbar */}
      {selected.size > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#14110e]/10 bg-[#14110e]/[0.03] px-3 py-2 text-sm">
          <span className="font-medium text-[#14110e]">
            {selected.size} selected
          </span>
          <span className="text-[#8a8173]">· set plan to</span>
          {(["core", "billing_only", "full"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={busyId === "__bulk__"}
              onClick={() => setConfirm({ kind: "bulk", preset: p })}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "h-7 border-[#14110e]/15 text-xs",
              )}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-[#8a8173] underline underline-offset-2"
          >
            Clear
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[#14110e]/8 bg-white px-4 py-6 text-sm text-[#7a7164]">
          No owners match these filters.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#14110e]/8 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-[#14110e]/8 text-left text-xs text-[#8a8173]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allInViewSelected}
                    onChange={toggleAll}
                    className="size-4 accent-[#14110e]"
                  />
                </th>
                <th className="px-3 py-3 font-medium">Owner</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Restaurant</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((owner) => {
                const rowBusy = busyId === owner.uid;
                return (
                  <tr
                    key={owner.uid}
                    className="border-b border-[#14110e]/5 last:border-0 align-top"
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${owner.displayName}`}
                        checked={selected.has(owner.uid)}
                        onChange={() => toggleOne(owner.uid)}
                        className="size-4 accent-[#14110e]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={ROUTES.adminOwner(owner.uid)}
                        className="font-medium text-[#14110e] hover:underline"
                      >
                        {owner.displayName || "Owner"}
                      </Link>
                      <p className="text-xs text-[#7a7164]">{owner.email}</p>
                      {owner.suspendReason ? (
                        <p className="mt-0.5 text-xs text-destructive">
                          {owner.suspendReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#5c554a]">
                        {owner.accountStatus}
                      </span>
                      <div className="mt-1 flex gap-1">
                        {owner.accountStatus !== "active" ? (
                          <button
                            type="button"
                            disabled={rowBusy}
                            onClick={() => void quickStatus(owner.uid, "active")}
                            className="text-[11px] text-[#14110e] underline underline-offset-2 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        ) : null}
                        {owner.accountStatus !== "suspended" ? (
                          <button
                            type="button"
                            disabled={rowBusy}
                            onClick={() =>
                              void quickStatus(owner.uid, "suspended")
                            }
                            className="text-[11px] text-destructive underline underline-offset-2 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <PresetPicker
                        compact
                        disabled={rowBusy}
                        modules={owner.modules}
                        onChange={(m) => onRowPlanChange(owner, m)}
                      />
                      {owner.modulePreset === "custom" ? (
                        <p className="mt-1 text-[11px] text-[#8a8173]">
                          custom mix
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {owner.primaryRestaurant ? (
                        <div>
                          <span className="text-[#14110e]">
                            {owner.primaryRestaurant.name}
                          </span>
                          {owner.restaurantCount > 1 ? (
                            <span className="text-xs text-[#8a8173]">
                              {" "}
                              +{owner.restaurantCount - 1}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[#8a8173]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#7a7164]">
                      {formatDate(owner.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={ROUTES.adminOwner(owner.uid)}
                        className="text-xs text-[#8a8173] underline underline-offset-2 hover:text-[#14110e]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.kind === "bulk"
            ? `Set ${selected.size} owners to ${PRESET_LABELS[confirm.preset]}?`
            : "Change module access?"
        }
        description={
          confirm?.kind === "bulk" ? (
            <>
              Each selected owner&apos;s access becomes{" "}
              <strong>{PRESET_LABELS[confirm.preset]}</strong>. They see it on
              their next sign-in.
            </>
          ) : confirm?.kind === "single" ? (
            <>
              {confirm.name}&apos;s access becomes{" "}
              <strong>{PRESET_LABELS[detectPreset(confirm.modules)]}</strong> on
              their next sign-in.
            </>
          ) : null
        }
        confirmLabel="Change access"
        busy={busyId !== null}
        onConfirm={() => {
          if (confirm?.kind === "bulk") return applyBulk(confirm.preset);
          if (confirm?.kind === "single")
            return applySingle(confirm.uid, confirm.modules);
        }}
      />
    </div>
  );
}
