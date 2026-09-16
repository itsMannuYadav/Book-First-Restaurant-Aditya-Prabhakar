"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ChevronDown, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditLog = {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

type LogsResponse = {
  logs: AuditLog[];
  nextCursor: string | null;
  fetchedAt: string;
};

// ─── Action catalogue ─────────────────────────────────────────────────────────

type ActionMeta = { label: string; badgeClass: string; group: FilterGroup };
type FilterGroup = "all" | "owners" | "restaurants" | "menu";

const ACTION_META: Record<string, ActionMeta> = {
  "owner.active": {
    label: "Owner approved",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    group: "owners",
  },
  "owner.suspended": {
    label: "Owner suspended",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    group: "owners",
  },
  "owner.modules": {
    label: "Plan changed",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    group: "owners",
  },
  "owner.modules.bulk": {
    label: "Bulk plan change",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    group: "owners",
  },
  "restaurant.update": {
    label: "Restaurant updated",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    group: "restaurants",
  },
  "category.create": {
    label: "Category added",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    group: "menu",
  },
  "category.update": {
    label: "Category updated",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    group: "menu",
  },
  "category.delete": {
    label: "Category deleted",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    group: "menu",
  },
  "menuItem.create": {
    label: "Menu item added",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    group: "menu",
  },
  "menuItem.update": {
    label: "Menu item updated",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    group: "menu",
  },
  "menuItem.delete": {
    label: "Menu item deleted",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    group: "menu",
  },
  "menu.import": {
    label: "Menu imported",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    group: "menu",
  },
};

function resolveAction(action: string): ActionMeta {
  return (
    ACTION_META[action] ?? {
      label: action,
      badgeClass: "bg-[#14110e]/5 text-[#5c554a] border-[#14110e]/10",
      group: "all" as FilterGroup,
    }
  );
}

const FILTER_TABS: { value: FilterGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owners", label: "Owners" },
  { value: "restaurants", label: "Restaurants" },
  { value: "menu", label: "Menu" },
];

// ─── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_KEY = "df_logs_data";
const CACHE_TS_KEY = "df_logs_ts";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function readCache(): { logs: AuditLog[]; fetchedAt: string } | null {
  try {
    const ts = Number(localStorage.getItem(CACHE_TS_KEY) ?? 0);
    if (!ts || Date.now() - ts > CACHE_TTL) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { logs: AuditLog[]; fetchedAt: string };
  } catch {
    return null;
  }
}

function writeCache(logs: AuditLog[], fetchedAt: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ logs, fetchedAt }));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_TS_KEY);
  } catch {
    /* noop */
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAbsoluteTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function targetLabel(log: AuditLog): string {
  const { targetType, targetId, meta } = log;
  const name =
    typeof meta?.name === "string"
      ? meta.name
      : typeof meta?.restaurantName === "string"
        ? meta.restaurantName
        : null;
  const short = targetId.length > 12 ? `${targetId.slice(0, 10)}…` : targetId;
  return name ? `${name}` : `${targetType}:${short}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const { label, badgeClass } = resolveAction(action);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        badgeClass,
      )}
    >
      {label}
    </span>
  );
}

function MetaRow({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return <p className="text-xs text-[#8a8173]">No details.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([k, v]) => (
        <>
          <dt key={`k-${k}`} className="font-medium text-[#5c554a]">
            {k}
          </dt>
          <dd key={`v-${k}`} className="break-all text-[#14110e]">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </>
      ))}
    </dl>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasMeta =
    log.meta && Object.keys(log.meta).some((k) => {
      const v = log.meta[k];
      return v !== undefined && v !== null && v !== "";
    });

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-[#14110e]/5 hover:bg-[#14110e]/[0.02]"
        onClick={() => hasMeta && setExpanded((e) => !e)}
      >
        {/* Time */}
        <td className="py-3 pr-4 text-left align-top">
          <span
            className="text-sm text-[#5c554a] whitespace-nowrap"
            title={formatAbsoluteTime(log.createdAt)}
          >
            {formatRelativeTime(log.createdAt)}
          </span>
        </td>

        {/* Actor */}
        <td className="py-3 pr-4 text-left align-top">
          <span
            className="block max-w-[180px] truncate text-sm font-medium text-[#14110e]"
            title={log.actorEmail}
          >
            {log.actorEmail}
          </span>
        </td>

        {/* Action badge */}
        <td className="py-3 pr-4 text-left align-top">
          <ActionBadge action={log.action} />
        </td>

        {/* Target */}
        <td className="py-3 pr-4 text-left align-top">
          <span className="text-sm text-[#7a7164]" title={log.targetId}>
            {targetLabel(log)}
          </span>
        </td>

        {/* Expand toggle */}
        <td className="py-3 text-left align-top">
          {hasMeta ? (
            <button
              type="button"
              className="rounded p-0.5 text-[#8a8173] hover:text-[#14110e]"
              aria-label={expanded ? "Collapse details" : "Expand details"}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((x) => !x);
              }}
            >
              {expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          ) : null}
        </td>
      </tr>

      {expanded && hasMeta ? (
        <tr className="border-b border-[#14110e]/5 bg-[#faf7f1]">
          <td colSpan={5} className="px-4 py-3">
            <MetaRow meta={log.meta} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-[#14110e]/5">
          <td className="py-3 pr-4">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="py-3 pr-4">
            <Skeleton className="h-4 w-36" />
          </td>
          <td className="py-3 pr-4">
            <Skeleton className="h-5 w-28 rounded-full" />
          </td>
          <td className="py-3 pr-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="py-3">
            <Skeleton className="h-4 w-4" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<FilterGroup>("all");
  const [actorSearch, setActorSearch] = useState("");

  const loadData = useCallback(
    async (force = false, cursor?: string) => {
      const isInitial = !cursor;

      if (isInitial && !force) {
        const cached = readCache();
        if (cached) {
          setLogs(cached.logs);
          setFetchedAt(cached.fetchedAt);
          setLoading(false);
          return;
        }
      }

      try {
        isInitial ? setLoading(true) : setLoadingMore(true);
        setError(null);

        const params = new URLSearchParams({ limit: "200" });
        if (cursor) params.set("cursor", cursor);

        const data = await adminFetch<LogsResponse>(
          `/api/admin/logs?${params.toString()}`,
        );

        if (isInitial) {
          setLogs(data.logs);
          writeCache(data.logs, data.fetchedAt);
        } else {
          setLogs((prev) => [...prev, ...data.logs]);
        }

        setNextCursor(data.nextCursor);
        setFetchedAt(data.fetchedAt);
      } catch (err) {
        setError(
          err instanceof AdminApiError ? err.message : "Failed to load logs.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // On mount — respect the hourly cache
  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  function handleForceRefresh() {
    clearCache();
    setNextCursor(null);
    void loadData(true);
  }

  function handleLoadMore() {
    if (nextCursor) void loadData(false, nextCursor);
  }

  // ── Filtered view ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = logs;
    if (group !== "all") {
      result = result.filter(
        (l) => resolveAction(l.action).group === group,
      );
    }
    if (actorSearch.trim()) {
      const q = actorSearch.trim().toLowerCase();
      result = result.filter((l) => l.actorEmail.toLowerCase().includes(q));
    }
    return result;
  }, [logs, group, actorSearch]);

  // ── Refresh status text ────────────────────────────────────────────────────

  const refreshStatus = fetchedAt
    ? `Refreshed ${formatRelativeTime(fetchedAt)}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Activity Logs"
        description="Every admin action across your platform — who did what and when."
        action={
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw
                className={cn("size-3.5", loading && "animate-spin")}
              />
              Refresh now
            </Button>
            {refreshStatus ? (
              <p className="text-right text-xs text-[#8a8173]">
                {refreshStatus} · auto-refreshes hourly
              </p>
            ) : null}
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Group tabs */}
        <div className="flex overflow-hidden rounded-lg border border-[#14110e]/10 bg-white">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setGroup(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                group === tab.value
                  ? "bg-[#14110e] text-[#f4efe6]"
                  : "text-[#5c554a] hover:bg-[#14110e]/5",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actor search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8a8173]" />
          <Input
            placeholder="Filter by admin email…"
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            className="h-8 w-52 pl-7 text-sm"
          />
        </div>

        {/* Count */}
        {!loading && (
          <p className="ml-auto text-xs text-[#8a8173]">
            {filtered.length}{" "}
            {filtered.length !== logs.length
              ? `of ${logs.length} events`
              : "events"}
          </p>
        )}
      </div>

      {/* Error state */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#14110e]/8 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[#14110e]/8 bg-[#faf7f1]">
                <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
                  Time
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
                  Admin
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
                  Action
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
                  Target
                </th>
                <th className="py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#8a8173]" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-sm text-[#8a8173]"
                  >
                    {logs.length === 0
                      ? "No activity logged yet."
                      : "No events match the current filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => <LogRow key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Load more footer */}
        {nextCursor && !loading ? (
          <div className="border-t border-[#14110e]/8 px-4 py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="gap-2 text-[#5c554a]"
            >
              {loadingMore ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : null}
              Load earlier events
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
