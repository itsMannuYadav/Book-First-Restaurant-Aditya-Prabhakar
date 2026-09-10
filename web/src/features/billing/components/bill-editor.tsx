"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_TAX_RATE } from "@/constants/billing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  createDraftBill,
  updateDraftBill,
  deleteDraftBill,
} from "@/lib/firebase/bills";
import { ownerFetch, OwnerApiError } from "@/lib/owner/api-client";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { listMenuItems } from "@/lib/firebase/menu-items";
import { subscribeOwnerOrders } from "@/lib/firebase/orders";
import { computeTotals, normalizeLineItems } from "@/features/billing/lib/bill-calcs";
import { formatMoney } from "@/features/billing/lib/format";
import {
  LineItemsField,
  newLine,
  type EditorLine,
} from "@/features/billing/components/line-items-field";
import type {
  Bill,
  BillDiscountType,
  BillDraftInput,
  MenuItemRecord,
  OwnerOrderView,
  Restaurant,
} from "@/types";

function linesFromBill(bill: Bill): EditorLine[] {
  return bill.lineItems.map((item) =>
    newLine({
      name: item.name,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    }),
  );
}

export function BillEditor({
  restaurant,
  bill,
}: {
  restaurant: Restaurant;
  bill?: Bill;
}) {
  const router = useRouter();
  const { hasModule } = useAuth();
  const editing = Boolean(bill);

  const [customerName, setCustomerName] = useState(bill?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(bill?.customerPhone ?? "");
  const [customerGstin, setCustomerGstin] = useState(bill?.customerGstin ?? "");
  const [lines, setLines] = useState<EditorLine[]>(
    bill ? linesFromBill(bill) : [newLine()],
  );
  const [discountType, setDiscountType] = useState<BillDiscountType>(
    bill?.discount.type ?? "amount",
  );
  const [discountValue, setDiscountValue] = useState(
    bill ? String(bill.discount.value || "") : "",
  );
  const [taxRate, setTaxRate] = useState(
    String(bill?.tax.rate ?? restaurant.taxRate ?? DEFAULT_TAX_RATE),
  );
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [orderId, setOrderId] = useState<string | null>(bill?.orderId ?? null);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);

  useEffect(() => {
    if (!hasModule("orders") || !restaurant.id) return;
    const unsub = subscribeOwnerOrders(
      restaurant.id,
      (next) => setOrders(next),
      () => setOrders([]),
    );
    return () => unsub();
  }, [hasModule, restaurant.id]);

  useEffect(() => {
    if (!hasModule("menu") || !restaurant.id) return;
    let cancelled = false;
    void listMenuItems(restaurant.id)
      .then((items) => {
        if (!cancelled) setMenuItems(items.filter((i) => i.isAvailable !== false));
      })
      .catch(() => {
        if (!cancelled) setMenuItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hasModule, restaurant.id]);

  const draft: BillDraftInput = useMemo(
    () => ({
      orderId,
      customerName,
      customerPhone,
      customerGstin,
      lineItems: lines.map((l) => ({
        name: l.name,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      })),
      discount: { type: discountType, value: Number(discountValue) || 0 },
      taxRate: Number(taxRate) || 0,
      notes,
    }),
    [
      orderId,
      customerName,
      customerPhone,
      customerGstin,
      lines,
      discountType,
      discountValue,
      taxRate,
      notes,
    ],
  );

  const totals = useMemo(
    () =>
      computeTotals(
        normalizeLineItems(draft.lineItems),
        draft.discount,
        draft.taxRate,
      ),
    [draft],
  );

  const validLineCount = normalizeLineItems(draft.lineItems).length;
  const currency = restaurant.currency || "₹";

  function applyOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setOrderId(order.id);
    setLines(
      order.items.map((item) =>
        newLine({
          name: item.name,
          quantity: String(item.quantity),
          unitPrice: String(item.price),
        }),
      ),
    );
    if (!customerName) setCustomerName(order.tableLabel);
    toast.success(`Loaded ${order.shortCode}`);
  }

  function addMenuItem(id: string) {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;
    setLines((prev) => [
      ...prev.filter((l) => l.name.trim() || l.unitPrice.trim()),
      newLine({ name: item.name, quantity: "1", unitPrice: String(item.price) }),
    ]);
  }

  async function persist(): Promise<string> {
    if (editing && bill) {
      await updateDraftBill(bill.id, restaurant, draft);
      return bill.id;
    }
    return createDraftBill(restaurant, draft, restaurant.ownerId);
  }

  async function handleSaveDraft() {
    if (validLineCount === 0) {
      toast.error("Add at least one line item with a quantity.");
      return;
    }
    setSaving(true);
    try {
      const id = await persist();
      toast.success("Draft saved");
      router.push(ROUTES.bill(id));
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (validLineCount === 0) {
      toast.error("Add at least one line item with a quantity.");
      return;
    }
    setSaving(true);
    try {
      const id = await persist();
      await ownerFetch(`/api/billing/bills/${id}/finalize`, { method: "POST" });
      toast.success("Bill finalized");
      router.push(ROUTES.bill(id));
    } catch (err) {
      toast.error(
        err instanceof OwnerApiError ? err.message : getFirebaseErrorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    if (!editing || !bill) {
      router.push(ROUTES.billing);
      return;
    }
    setSaving(true);
    try {
      await deleteDraftBill(bill.id);
      toast.success("Draft deleted");
      router.push(ROUTES.billing);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title={editing ? "Edit draft bill" : "New bill"}
        description="Add line items, set GST and any discount, then finalize to lock the number."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#14110e]">Customer</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  className="mt-1"
                  placeholder="Walk-in"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-phone">Phone</Label>
                <Input
                  id="c-phone"
                  className="mt-1"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-gstin">Customer GSTIN (optional)</Label>
                <Input
                  id="c-gstin"
                  className="mt-1"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#14110e]">Line items</h2>
              <div className="flex flex-wrap gap-2">
                {hasModule("orders") && orders.length > 0 ? (
                  <select
                    className="rounded-lg border border-[#14110e]/15 bg-white px-2.5 py-1.5 text-xs text-[#5c554a]"
                    value=""
                    onChange={(e) => e.target.value && applyOrder(e.target.value)}
                  >
                    <option value="">Load from order…</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.shortCode} · {o.tableLabel}
                      </option>
                    ))}
                  </select>
                ) : null}
                {hasModule("menu") && menuItems.length > 0 ? (
                  <select
                    className="rounded-lg border border-[#14110e]/15 bg-white px-2.5 py-1.5 text-xs text-[#5c554a]"
                    value=""
                    onChange={(e) => e.target.value && addMenuItem(e.target.value)}
                  >
                    <option value="">Add menu item…</option>
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
            {orderId ? (
              <p className="mt-2 text-xs text-[#8a8173]">
                Linked to an order.{" "}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => setOrderId(null)}
                >
                  Unlink
                </button>
              </p>
            ) : null}
            <div className="mt-4">
              <LineItemsField
                currency={currency}
                value={lines}
                onChange={setLines}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#14110e]">
              Discount &amp; tax
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="d-type">Discount type</Label>
                <select
                  id="d-type"
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as BillDiscountType)
                  }
                >
                  <option value="amount">Amount ({currency})</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="d-value">Discount value</Label>
                <Input
                  id="d-value"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className="mt-1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="t-rate">GST rate (%)</Label>
                <Input
                  id="t-rate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className="mt-1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              className="mt-1"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[#14110e]/8 bg-[#14110e] p-5 text-[#f4efe6]">
            <h2 className="text-sm font-semibold text-[#c9b896]">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#c9b896]">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatMoney(currency, totals.subtotal)}
                </dd>
              </div>
              {totals.discount.amount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-[#c9b896]">Discount</dt>
                  <dd className="tabular-nums">
                    −{formatMoney(currency, totals.discount.amount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[#c9b896]">
                  CGST @ {(totals.tax.rate / 2).toFixed(2)}%
                </dt>
                <dd className="tabular-nums">
                  {formatMoney(currency, totals.tax.cgstAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#c9b896]">
                  SGST @ {(totals.tax.rate / 2).toFixed(2)}%
                </dt>
                <dd className="tabular-nums">
                  {formatMoney(currency, totals.tax.sgstAmount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(currency, totals.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleFinalize()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
                )}
              >
                Save &amp; finalize
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveDraft()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full border-white/20 bg-transparent text-[#f4efe6] hover:bg-white/10",
                )}
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDiscard()}
                className="w-full py-2 text-xs text-[#c9b896] underline underline-offset-2"
              >
                {editing ? "Delete draft" : "Cancel"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8a8173]">
            <Link href={ROUTES.billing} className="underline underline-offset-2">
              Back to bills
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
