"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { BILL_STATUS_LABELS } from "@/constants/billing";
import { cn } from "@/lib/utils";
import { useBills } from "@/features/billing/hooks/use-bills";
import { BillStatusBadge } from "@/features/billing/components/bill-status-badge";
import { formatDate, formatMoney } from "@/features/billing/lib/format";
import type { BillStatus } from "@/types";

type StatusFilter = "all" | BillStatus;

const STATUS_TABS: StatusFilter[] = [
  "all",
  "draft",
  "finalized",
  "paid",
  "void",
];

export function BillsList() {
  const { bills, loading, error, restaurantLoading, restaurant } = useBills();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const currency = restaurant?.currency || "₹";

  const summary = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let thisMonth = 0;
    let outstandingSum = 0;
    let outstandingCount = 0;
    let draftCount = 0;
    for (const bill of bills) {
      if (bill.status === "draft") draftCount += 1;
      if (bill.status === "finalized") {
        outstandingSum += bill.total;
        outstandingCount += 1;
      }
      if (bill.status === "finalized" || bill.status === "paid") {
        const day = (bill.finalizedAt || bill.createdAt).slice(0, 7);
        if (day === ym) thisMonth += bill.total;
      }
    }
    return { thisMonth, outstandingSum, outstandingCount, draftCount };
  }, [bills]);

  const filtered = useMemo(() => {
    return bills.filter((bill) => {
      if (status !== "all" && bill.status !== status) return false;
      const day = bill.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [bills, status, from, to]);

  const busy = loading || restaurantLoading;

  const newBillButton = (
    <Link
      href={ROUTES.billingNew}
      className={cn(
        buttonVariants(),
        "gap-2 bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
      )}
    >
      <Plus className="size-4" />
      New bill
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Bills"
        description="Create, finalize, and track customer invoices."
        action={newBillButton}
      />

      {!busy && bills.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Billed this month", value: formatMoney(currency, summary.thisMonth) },
            {
              label: `Outstanding · ${summary.outstandingCount}`,
              value: formatMoney(currency, summary.outstandingSum),
            },
            { label: "Open drafts", value: String(summary.draftCount) },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-3xl border border-[#14110e]/8 bg-white/70 p-5 shadow-sm"
            >
              <p className="text-xs font-medium tracking-wide text-[#8a8173] uppercase">
                {tile.label}
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e] tabular-nums">
                {tile.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                status === tab
                  ? "bg-[#14110e] text-[#f4efe6]"
                  : "bg-white text-[#5c554a] hover:bg-[#14110e]/5",
              )}
            >
              {tab === "all" ? "All" : BILL_STATUS_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs text-[#7a7164]">
            From
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 h-9"
            />
          </label>
          <label className="text-xs text-[#7a7164]">
            To
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 h-9"
            />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="pb-2 text-xs text-[#8a8173] underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {busy ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Raise your first invoice — from an existing order or from scratch."
          action={newBillButton}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#14110e]/15 px-6 py-12 text-center text-sm text-[#8a8173]">
          No bills match these filters.
        </div>
      ) : (
        <ul className="divide-y divide-[#14110e]/8 overflow-hidden rounded-2xl border border-[#14110e]/8 bg-white">
          {filtered.map((bill) => (
            <li key={bill.id}>
              <Link
                href={ROUTES.bill(bill.id)}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-[#14110e]/[0.03]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#14110e]">
                    {bill.billLabel || "Draft bill"}
                  </p>
                  <p className="mt-0.5 text-sm text-[#7a7164]">
                    {bill.customerName || "Walk-in"} · {formatDate(bill.createdAt)}{" "}
                    · {bill.lineItems.length} item
                    {bill.lineItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#14110e] tabular-nums">
                    {formatMoney(bill.currency, bill.total)}
                  </span>
                  <BillStatusBadge status={bill.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
