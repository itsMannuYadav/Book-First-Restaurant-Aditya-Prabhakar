import type {
  Bill,
  BillDiscount,
  BillLineItem,
  BillRestaurantSnapshot,
  BillStatus,
  BillTax,
} from "@/types";

/** Framework-agnostic Bill mapper — safe for both the client and Admin SDKs. */
export function mapBillData(id: string, data: Record<string, unknown>): Bill {
  const lineItems: BillLineItem[] = Array.isArray(data.lineItems)
    ? (data.lineItems as Record<string, unknown>[]).map((row, index) => ({
        id: String(row.id ?? `li_${index + 1}`),
        name: String(row.name ?? ""),
        quantity: Number(row.quantity ?? 0),
        unitPrice: Number(row.unitPrice ?? 0),
        amount: Number(row.amount ?? 0),
      }))
    : [];

  const d = (data.discount ?? {}) as Record<string, unknown>;
  const discount: BillDiscount = {
    type: d.type === "percent" ? "percent" : "amount",
    value: Number(d.value ?? 0),
    amount: Number(d.amount ?? 0),
  };

  const t = (data.tax ?? {}) as Record<string, unknown>;
  const tax: BillTax = {
    rate: Number(t.rate ?? 0),
    mode: "cgst_sgst",
    cgstAmount: Number(t.cgstAmount ?? 0),
    sgstAmount: Number(t.sgstAmount ?? 0),
    amount: Number(t.amount ?? 0),
  };

  const s = (data.restaurantSnapshot ?? {}) as Record<string, unknown>;
  const restaurantSnapshot: BillRestaurantSnapshot = {
    name: String(s.name ?? ""),
    logoUrl: s.logoUrl ? String(s.logoUrl) : undefined,
    address: s.address ? String(s.address) : undefined,
    phone: s.phone ? String(s.phone) : undefined,
    gstin: s.gstin ? String(s.gstin) : undefined,
  };

  const billNumberRaw = data.billNumber;

  return {
    id,
    restaurantId: String(data.restaurantId ?? ""),
    ownerId: String(data.ownerId ?? ""),
    billNumber:
      typeof billNumberRaw === "number" ? billNumberRaw : null,
    billLabel: String(data.billLabel ?? ""),
    orderId: data.orderId ? String(data.orderId) : null,
    status: (data.status as BillStatus) ?? "draft",
    customerName: data.customerName ? String(data.customerName) : undefined,
    customerPhone: data.customerPhone ? String(data.customerPhone) : undefined,
    customerGstin: data.customerGstin ? String(data.customerGstin) : undefined,
    lineItems,
    subtotal: Number(data.subtotal ?? 0),
    discount,
    tax,
    total: Number(data.total ?? 0),
    currency: String(data.currency ?? "₹"),
    notes: data.notes ? String(data.notes) : undefined,
    restaurantSnapshot,
    createdByUid: String(data.createdByUid ?? ""),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
    finalizedAt: data.finalizedAt ? String(data.finalizedAt) : undefined,
    paidAt: data.paidAt ? String(data.paidAt) : undefined,
    voidedAt: data.voidedAt ? String(data.voidedAt) : undefined,
  };
}

export function billSnapshotFrom(restaurant: {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  gstin?: string;
}): BillRestaurantSnapshot {
  return {
    name: restaurant.name,
    ...(restaurant.logoUrl ? { logoUrl: restaurant.logoUrl } : {}),
    ...(restaurant.address ? { address: restaurant.address } : {}),
    ...(restaurant.phone ? { phone: restaurant.phone } : {}),
    ...(restaurant.gstin ? { gstin: restaurant.gstin } : {}),
  };
}
