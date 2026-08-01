"use client";

import type { MenuCategory } from "@/types";
import { MenuItemCard } from "@/features/menu-public/components/menu-item-card";

interface CategorySectionProps {
  category: MenuCategory;
  currency: string;
  selection: Record<string, number>;
  onAdd: (itemId: string) => void;
}

export function CategorySection({
  category,
  currency,
  selection,
  onAdd,
}: CategorySectionProps) {
  return (
    <section
      id={category.id}
      className="mb-10 scroll-mt-[140px]"
      aria-labelledby={`${category.id}-title`}
    >
      <div className="mb-1.5 flex items-center gap-2.5 border-b border-[var(--menu-border)] pb-2">
        {category.icon ? (
          <span className="text-2xl" aria-hidden>
            {category.icon}
          </span>
        ) : null}
        <h2
          id={`${category.id}-title`}
          className="menu-heading text-[1.6rem] font-bold tracking-tight text-[var(--menu-text)]"
        >
          {category.name}
        </h2>
      </div>

      {category.description ? (
        <p className="mb-[18px] text-[0.88rem] text-[var(--menu-muted)]">
          {category.description}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]">
        {category.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            currency={currency}
            quantity={selection[item.id] ?? 0}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}
