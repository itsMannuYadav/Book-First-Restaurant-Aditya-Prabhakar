export type BillStatus = "draft" | "finalized" | "paid" | "void";

export type BillDiscountType = "amount" | "percent";

export interface BillLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** quantity * unitPrice, rounded to 2dp. Stored so historical bills never drift. */
  amount: number;
}

export interface BillDiscount {
  type: BillDiscountType;
  /** Raw value the owner entered (a rupee amount, or a percent 0-100). */
  value: number;
  /** Resolved discount in currency, applied pre-tax. */
  amount: number;
}

export interface BillTax {
  /** Combined GST rate as a percent, e.g. 5 = 5%. */
  rate: number;
  /** Rendered as CGST + SGST halves on the invoice. */
  mode: "cgst_sgst";
  cgstAmount: number;
  sgstAmount: number;
  /** cgstAmount + sgstAmount. */
  amount: number;
}

/** Restaurant identity frozen onto the bill when it is finalized. */
export interface BillRestaurantSnapshot {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  gstin?: string;
}

export interface Bill {
  id: string;
  restaurantId: string;
  ownerId: string;
  /** Null until finalized. Sequential per restaurant, gapless. */
  billNumber: number | null;
  /** Formatted label, e.g. "INV-2526-0007". Empty until finalized. */
  billLabel: string;
  /** Linked order, when the bill was generated from one. */
  orderId?: string | null;
  status: BillStatus;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  lineItems: BillLineItem[];
  subtotal: number;
  discount: BillDiscount;
  tax: BillTax;
  total: number;
  currency: string;
  notes?: string;
  restaurantSnapshot: BillRestaurantSnapshot;
  createdByUid: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  paidAt?: string;
  voidedAt?: string;
}

/** Shape the editor collects; server/lib computes money fields. */
export interface BillDraftInput {
  orderId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  lineItems: Array<Pick<BillLineItem, "name" | "quantity" | "unitPrice">>;
  discount: Pick<BillDiscount, "type" | "value">;
  taxRate: number;
  notes?: string;
}

export interface BillTotals {
  subtotal: number;
  discount: BillDiscount;
  tax: BillTax;
  total: number;
}
