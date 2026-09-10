"use client";

import { useEffect } from "react";
import { BILL_STATUS_LABELS } from "@/constants/billing";
import { BillLogo } from "@/features/billing/components/bill-logo";
import { formatDate, formatMoney } from "@/features/billing/lib/format";
import type { Bill } from "@/types";

/** Standalone A4 tax invoice — rendered without the dashboard chrome. */
export function BillPrintView({ bill }: { bill: Bill }) {
  const currency = bill.currency || "₹";
  const snap = bill.restaurantSnapshot;
  const half = (bill.tax.rate / 2).toFixed(2);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3efe7] px-4 py-8 text-[#14110e] print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-[210mm] rounded-xl bg-white p-8 shadow-sm print:rounded-none print:p-[14mm] print:shadow-none">
        {/* letterhead */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-[#14110e] pb-5">
          <div className="flex items-start gap-4">
            <BillLogo name={snap.name} logoUrl={snap.logoUrl} size="lg" />
            <div>
              <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold">
                {snap.name || "Restaurant"}
              </h1>
              {snap.address ? (
                <p className="mt-1 max-w-xs text-sm text-[#5c554a]">
                  {snap.address}
                </p>
              ) : null}
              {snap.phone ? (
                <p className="text-sm text-[#5c554a]">{snap.phone}</p>
              ) : null}
              {snap.gstin ? (
                <p className="text-xs text-[#5c554a]">GSTIN: {snap.gstin}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-serif-display)] text-xl font-bold uppercase tracking-wide">
              Tax Invoice
            </p>
            <p className="mt-1 text-sm font-medium">{bill.billLabel || "Draft"}</p>
            <p className="text-sm text-[#5c554a]">
              {formatDate(bill.finalizedAt || bill.createdAt)}
            </p>
            {bill.status !== "finalized" ? (
              <p className="mt-1 text-xs font-semibold uppercase text-[#8a8173]">
                {BILL_STATUS_LABELS[bill.status]}
              </p>
            ) : null}
          </div>
        </div>

        {/* bill to */}
        <div className="py-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
            Billed to
          </p>
          <p className="mt-1 font-medium">
            {bill.customerName || "Walk-in customer"}
          </p>
          {bill.customerPhone ? <p>{bill.customerPhone}</p> : null}
          {bill.customerGstin ? (
            <p className="text-xs text-[#5c554a]">GSTIN: {bill.customerGstin}</p>
          ) : null}
        </div>

        {/* line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-[#14110e]/25 text-left">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Unit</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-[#14110e]/10">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(currency, item.unitPrice)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(currency, item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-5 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#5c554a]">Subtotal</dt>
              <dd className="tabular-nums">
                {formatMoney(currency, bill.subtotal)}
              </dd>
            </div>
            {bill.discount.amount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-[#5c554a]">
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
              <dt className="text-[#5c554a]">CGST @ {half}%</dt>
              <dd className="tabular-nums">
                {formatMoney(currency, bill.tax.cgstAmount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5c554a]">SGST @ {half}%</dt>
              <dd className="tabular-nums">
                {formatMoney(currency, bill.tax.sgstAmount)}
              </dd>
            </div>
            <div className="mt-1 flex justify-between rounded-lg bg-[#14110e] px-3 py-2 text-base font-bold text-[#f4efe6]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(currency, bill.total)}</dd>
            </div>
          </dl>
        </div>

        {bill.notes ? (
          <p className="mt-6 border-t border-[#14110e]/10 pt-4 text-sm text-[#5c554a]">
            {bill.notes}
          </p>
        ) : null}

        <p className="mt-10 text-center text-xs text-[#8a8173]">
          Thank you for your visit.
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="mx-auto mt-6 block rounded-lg border border-[#14110e]/20 bg-white px-4 py-2 text-sm print:hidden"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
