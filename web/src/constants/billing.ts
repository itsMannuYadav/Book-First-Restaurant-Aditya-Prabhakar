import type { BillStatus } from "@/types";

export const BILL_STATUSES: BillStatus[] = ["draft", "finalized", "paid", "void"];

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  draft: "Draft",
  finalized: "Finalized",
  paid: "Paid",
  void: "Void",
};

/** Owner-facing status transitions handled server-side (Admin SDK). */
export const BILL_STATUS_TRANSITIONS: Record<BillStatus, BillStatus[]> = {
  draft: ["finalized"],
  finalized: ["paid", "void"],
  paid: ["void"],
  void: [],
};

/** Fallback combined GST rate (percent) when the restaurant has none set. */
export const DEFAULT_TAX_RATE = 5;

/** Now, shifted to IST (UTC+5:30) so the FY boundary and invoice date match Indian books. */
export function istNow(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

/**
 * Indian financial year key for a date: Apr–Mar. 2025-09-10 -> "2526".
 * Used for the invoice label and to reset the per-restaurant sequence yearly.
 */
export function financialYearKey(date: Date): string {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

/** e.g. (7, 2025-09-10) -> "INV-2526-0007". */
export function formatBillNumber(seq: number, date: Date): string {
  return `INV-${financialYearKey(date)}-${String(seq).padStart(4, "0")}`;
}
