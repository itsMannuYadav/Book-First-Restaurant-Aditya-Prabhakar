"use client";

import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lineAmount } from "@/features/billing/lib/bill-calcs";
import { formatMoney } from "@/features/billing/lib/format";

export type EditorLine = {
  key: string;
  name: string;
  quantity: string;
  unitPrice: string;
};

export function newLine(partial?: Partial<EditorLine>): EditorLine {
  return {
    key: `l_${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    quantity: "1",
    unitPrice: "",
    ...partial,
  };
}

export function LineItemsField({
  currency,
  value,
  onChange,
}: {
  currency: string;
  value: EditorLine[];
  onChange: (next: EditorLine[]) => void;
}) {
  function update(key: string, patch: Partial<EditorLine>) {
    onChange(value.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }
  function remove(key: string) {
    onChange(value.filter((line) => line.key !== key));
  }

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_5rem_7rem_6rem_2rem] gap-2 px-1 text-xs font-medium text-[#8a8173] sm:grid">
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {value.map((line) => {
        const amount = lineAmount(Number(line.quantity), Number(line.unitPrice));
        return (
          <div
            key={line.key}
            className="grid grid-cols-2 gap-2 rounded-xl border border-[#14110e]/8 bg-white p-3 sm:grid-cols-[1fr_5rem_7rem_6rem_2rem] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
          >
            <Input
              className="col-span-2 sm:col-span-1"
              placeholder="Item name"
              value={line.name}
              onChange={(e) => update(line.key, { name: e.target.value })}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              className="text-right"
              placeholder="Qty"
              value={line.quantity}
              onChange={(e) => update(line.key, { quantity: e.target.value })}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className="text-right"
              placeholder="0.00"
              value={line.unitPrice}
              onChange={(e) => update(line.key, { unitPrice: e.target.value })}
            />
            <span className="self-center text-right text-sm font-medium text-[#14110e] tabular-nums">
              {formatMoney(currency, amount)}
            </span>
            <button
              type="button"
              onClick={() => remove(line.key)}
              aria-label="Remove line"
              className="justify-self-end rounded-lg p-1.5 text-[#8a8173] transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...value, newLine()])}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 border-[#14110e]/15",
        )}
      >
        <Plus className="size-4" />
        Add line
      </button>
    </div>
  );
}
