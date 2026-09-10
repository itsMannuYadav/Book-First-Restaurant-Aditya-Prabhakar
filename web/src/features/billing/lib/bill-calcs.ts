import type { BillDraftInput, BillLineItem, BillTotals } from "@/types";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineAmount(quantity: number, unitPrice: number): number {
  const q = Number.isFinite(quantity) ? quantity : 0;
  const p = Number.isFinite(unitPrice) ? unitPrice : 0;
  return round2(Math.max(q, 0) * Math.max(p, 0));
}

export function normalizeLineItems(
  raw: BillDraftInput["lineItems"],
): BillLineItem[] {
  return raw
    .map((item, index) => {
      const quantity = Math.max(Number(item.quantity) || 0, 0);
      const unitPrice = Math.max(Number(item.unitPrice) || 0, 0);
      return {
        id: `li_${index + 1}`,
        name: item.name.trim(),
        quantity,
        unitPrice,
        amount: lineAmount(quantity, unitPrice),
      };
    })
    .filter((item) => item.name.length > 0 && item.quantity > 0);
}

/** Discount applies pre-tax; GST is split into equal CGST + SGST halves. */
export function computeTotals(
  lineItems: BillLineItem[],
  discount: BillDraftInput["discount"],
  taxRate: number,
): BillTotals {
  const subtotal = round2(
    lineItems.reduce((sum, item) => sum + item.amount, 0),
  );

  const rawValue = Math.max(Number(discount.value) || 0, 0);
  const discountAmount =
    discount.type === "percent"
      ? round2(subtotal * Math.min(rawValue, 100) / 100)
      : round2(Math.min(rawValue, subtotal));

  const taxable = round2(Math.max(subtotal - discountAmount, 0));
  const rate = Math.max(Number(taxRate) || 0, 0);
  const taxAmount = round2(taxable * rate / 100);
  const cgstAmount = round2(taxAmount / 2);
  const sgstAmount = round2(taxAmount - cgstAmount);
  const total = round2(taxable + taxAmount);

  return {
    subtotal,
    discount: { type: discount.type, value: rawValue, amount: discountAmount },
    tax: { rate, mode: "cgst_sgst", cgstAmount, sgstAmount, amount: taxAmount },
    total,
  };
}
