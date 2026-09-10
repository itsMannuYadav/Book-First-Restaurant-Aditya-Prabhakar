"use client";

import { useEffect } from "react";
import { formatDate, formatMoney } from "@/features/billing/lib/format";
import type { Bill } from "@/types";

/** Standalone A4-ish invoice. Rendered without the dashboard chrome. */
export function BillPrintView({ bill }: { bill: Bill }) {
  const currency = bill.currency || "₹";
  const snap = bill.restaurantSnapshot;

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white px-6 py-10 text-[#14110e] print:p-0">
      <div className="mx-auto max-w-[720px]">
        <div className="flex items-start justify-between gap-6 border-b border-[#14110e]/15 pb-5">
          <div>
            <h1 className="text-2xl font-bold">{snap.name || "Restaurant"}</h1>
            {snap.address ? (
              <p className="mt-1 max-w-xs text-sm text-[#5c554a]">{snap.address}</p>
            ) : null}
            {snap.phone ? (
              <p className="text-sm text-[#5c554a]">{snap.phone}</p>
            ) : null}
            {snap.gstin ? (
              <p className="text-xs text-[#5c554a]">GSTIN: {snap.gstin}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold uppercase tracking-wide">
              Tax Invoice
            </p>
            <p className="mt-1 text-sm">{bill.billLabel || "Draft"}</p>
            <p className="text-sm text-[#5c554a]">
              {formatDate(bill.finalizedAt || bill.createdAt)}
            </p>
            {bill.status !== "finalized" && bill.status !== "draft" ? (
              <p className="mt-1 text-xs font-semibold uppercase">{bill.status}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-5 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a8173]">
              Billed to
            </p>
            <p className="mt-1">{bill.customerName || "Walk-in customer"}</p>
            {bill.customerPhone ? <p>{bill.customerPhone}</p> : null}
            {bill.customerGstin ? (
              <p className="text-xs text-[#5c554a]">GSTIN: {bill.customerGstin}</p>
            ) : null}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-[#14110e]/15 text-left">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Unit</th>
              <th className="py-2 text-right font-medium">Amount</th>
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

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#5c554a]">Subtotal</span>
            <span className="tabular-nums">
              {formatMoney(currency, bill.subtotal)}
            </span>
          </div>
          {bill.discount.amount > 0 ? (
            <div className="flex justify-between">
              <span className="text-[#5c554a]">
                Discount
                {bill.discount.type === "percent"
                  ? ` (${bill.discount.value}%)`
                  : ""}
              </span>
              <span className="tabular-nums">
                −{formatMoney(currency, bill.discount.amount)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-[#5c554a]">
              CGST @ {(bill.tax.rate / 2).toFixed(2)}%
            </span>
            <span className="tabular-nums">
              {formatMoney(currency, bill.tax.cgstAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5c554a]">
              SGST @ {(bill.tax.rate / 2).toFixed(2)}%
            </span>
            <span className="tabular-nums">
              {formatMoney(currency, bill.tax.sgstAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#14110e]/15 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatMoney(currency, bill.total)}
            </span>
          </div>
        </div>

        {bill.notes ? (
          <p className="mt-6 border-t border-[#14110e]/10 pt-4 text-sm text-[#5c554a]">
            {bill.notes}
          </p>
        ) : null}

        <p className="mt-10 text-center text-xs text-[#8a8173]">
          Thank you for your visit.
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mx-auto mt-6 block rounded-lg border border-[#14110e]/20 px-4 py-2 text-sm print:hidden"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
