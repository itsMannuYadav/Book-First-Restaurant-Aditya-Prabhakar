"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { BILL_STATUS_TRANSITIONS } from "@/constants/billing";
import { cn } from "@/lib/utils";
import { ownerFetch, OwnerApiError } from "@/lib/owner/api-client";
import { BillStatusBadge } from "@/features/billing/components/bill-status-badge";
import { BillLogo } from "@/features/billing/components/bill-logo";
import { formatDateTime, formatMoney } from "@/features/billing/lib/format";
import type { Bill } from "@/types";

export function BillDetail({
  bill,
  onChange,
}: {
  bill: Bill;
  onChange: (next: Bill) => void;
}) {
  const [busy, setBusy] = useState(false);
  const currency = bill.currency || "₹";
  const canPay = BILL_STATUS_TRANSITIONS[bill.status].includes("paid");
  const canVoid = BILL_STATUS_TRANSITIONS[bill.status].includes("void");

  async function setStatus(status: "paid" | "void") {
    if (status === "void" && !window.confirm("Void this bill? This can’t be undone.")) {
      return;
    }
    setBusy(true);
    try {
      const { bill: next } = await ownerFetch<{ bill: Bill }>(
        `/api/billing/bills/${bill.id}/status`,
        { method: "POST", body: JSON.stringify({ status }) },
      );
      onChange(next);
      toast.success(status === "paid" ? "Marked paid" : "Bill voided");
    } catch (err) {
      toast.error(err instanceof OwnerApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const snap = bill.restaurantSnapshot;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title={bill.billLabel || "Bill"}
        description={`Created ${formatDateTime(bill.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.billPrint(bill.id)}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Printer className="size-4" />
              Print / PDF
            </Link>
            {canPay ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setStatus("paid")}
                className={cn(buttonVariants(), "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]")}
              >
                Mark paid
              </button>
            ) : null}
            {canVoid ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void setStatus("void")}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-destructive/30 text-destructive",
                )}
              >
                Void
              </button>
            ) : null}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <BillStatusBadge status={bill.status} />
        {bill.finalizedAt ? (
          <span className="text-xs text-[#8a8173]">
            Finalized {formatDateTime(bill.finalizedAt)}
          </span>
        ) : null}
        {bill.paidAt ? (
          <span className="text-xs text-[#8a8173]">
            Paid {formatDateTime(bill.paidAt)}
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#14110e]/8 bg-white">
        <div className="flex items-start gap-4 border-b border-[#14110e]/8 p-5">
          <BillLogo name={snap.name} logoUrl={snap.logoUrl} />
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-serif-display)] text-xl font-bold text-[#14110e]">
              {snap.name}
            </p>
            <p className="mt-1 text-sm text-[#7a7164]">
              {[snap.address, snap.phone].filter(Boolean).join(" · ") || "—"}
            </p>
            {snap.gstin ? (
              <p className="text-xs text-[#8a8173]">GSTIN: {snap.gstin}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
              Billed to
            </p>
            <p className="mt-1 text-sm text-[#14110e]">
              {bill.customerName || "Walk-in"}
            </p>
            {bill.customerPhone ? (
              <p className="text-sm text-[#7a7164]">{bill.customerPhone}</p>
            ) : null}
            {bill.customerGstin ? (
              <p className="text-xs text-[#8a8173]">GSTIN: {bill.customerGstin}</p>
            ) : null}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
              Invoice
            </p>
            <p className="mt-1 text-sm text-[#14110e]">{bill.billLabel || "—"}</p>
            <p className="text-sm text-[#7a7164]">
              {formatDateTime(bill.finalizedAt || bill.createdAt)}
            </p>
          </div>
        </div>

        <table className="w-full border-t border-[#14110e]/8 text-sm">
          <thead>
            <tr className="text-left text-xs text-[#8a8173]">
              <th className="px-5 py-2 font-medium">Item</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 text-right font-medium">Unit</th>
              <th className="px-5 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((item) => (
              <tr key={item.id} className="border-t border-[#14110e]/5">
                <td className="px-5 py-2 text-[#14110e]">{item.name}</td>
                <td className="px-2 py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatMoney(currency, item.unitPrice)}
                </td>
                <td className="px-5 py-2 text-right tabular-nums">
                  {formatMoney(currency, item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-1.5 border-t border-[#14110e]/8 p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#7a7164]">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(currency, bill.subtotal)}</dd>
          </div>
          {bill.discount.amount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-[#7a7164]">
                Discount
                {bill.discount.type === "percent"
                  ? ` (${bill.discount.value}%)`
                  : ""}
              </dt>
              <dd className="tabular-nums">
                −{formatMoney(currency, bill.discount.amount)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-[#7a7164]">
              CGST @ {(bill.tax.rate / 2).toFixed(2)}%
            </dt>
            <dd className="tabular-nums">
              {formatMoney(currency, bill.tax.cgstAmount)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#7a7164]">
              SGST @ {(bill.tax.rate / 2).toFixed(2)}%
            </dt>
            <dd className="tabular-nums">
              {formatMoney(currency, bill.tax.sgstAmount)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[#14110e]/10 pt-2 text-base font-semibold text-[#14110e]">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(currency, bill.total)}</dd>
          </div>
        </dl>

        {bill.notes ? (
          <p className="border-t border-[#14110e]/8 p-5 text-sm text-[#7a7164]">
            {bill.notes}
          </p>
        ) : null}
      </div>

      <Link
        href={ROUTES.billing}
        className="inline-flex items-center gap-1.5 text-sm text-[#8a8173] hover:text-[#14110e]"
      >
        <ArrowLeft className="size-4" />
        Back to bills
      </Link>
    </div>
  );
}
