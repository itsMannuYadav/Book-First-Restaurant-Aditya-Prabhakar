"use client";

import type { MenuItem } from "@/types";
import { formatPrice } from "@/features/menu-public/lib/filter-menu";
import { DietIcon } from "@/features/menu-public/components/diet-icon";

interface MenuItemCardProps {
  item: MenuItem;
  currency: string;
  quantity: number;
  onAdd: (itemId: string) => void;
}

export function MenuItemCard({
  item,
  currency,
  quantity,
  onAdd,
}: MenuItemCardProps) {
  const isVeg = item.tags?.includes("veg");
  const isNonVeg = item.tags?.includes("non-veg");

  return (
    <article className="group relative flex flex-col justify-between rounded-[14px] border border-[var(--menu-border-muted)] bg-[var(--menu-card)] px-[18px] py-4 shadow-[var(--menu-card-shadow)] transition-all duration-250 hover:-translate-y-[3px] hover:border-[var(--menu-border)] hover:bg-[var(--menu-card-hover)]">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isVeg ? <DietIcon type="veg" /> : null}
            {isNonVeg ? <DietIcon type="non-veg" /> : null}
            <h3 className="text-[1.08rem] font-semibold text-[var(--menu-text)]">
              {item.name}
            </h3>
          </div>
          <span className="menu-heading shrink-0 text-[1.1rem] font-bold whitespace-nowrap text-[var(--menu-accent)]">
            {formatPrice(currency, item.price)}
          </span>
        </div>

        {item.description ? (
          <p className="mb-3.5 text-[0.85rem] leading-snug text-[var(--menu-muted)]">
            {item.description}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between">
        {item.badge ? (
          <span className="rounded-lg border border-[var(--menu-badge-border)] bg-[var(--menu-badge-bg)] px-2 py-0.5 text-[0.72rem] font-bold tracking-wide text-[var(--menu-badge-text)] uppercase">
            {item.badge}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={() => onAdd(item.id)}
          className="flex items-center gap-1.5 rounded-full border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--menu-text)] transition-all duration-200 hover:border-transparent hover:bg-[image:var(--menu-pill-active)] hover:text-[var(--menu-pill-active-text)]"
        >
          {quantity > 0 ? `✓ Added (${quantity})` : "+ Add"}
        </button>
      </div>
    </article>
  );
}
