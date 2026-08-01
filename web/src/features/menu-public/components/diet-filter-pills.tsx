"use client";

import { DIET_FILTERS } from "@/constants/menu-themes";
import type { DietFilter } from "@/types";
import { cn } from "@/lib/utils";

interface DietFilterPillsProps {
  value: DietFilter;
  onChange: (filter: DietFilter) => void;
}

export function DietFilterPills({ value, onChange }: DietFilterPillsProps) {
  return (
    <div className="mx-auto max-w-[900px] px-5 pt-4">
      <div
        className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Dietary filters"
      >
        {DIET_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={value === filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.82rem] font-semibold whitespace-nowrap transition-all duration-200",
              value === filter.id
                ? "border-[var(--menu-accent)] bg-[var(--menu-accent-glow)] text-[var(--menu-accent)]"
                : "border-[var(--menu-border-muted)] bg-[var(--menu-card)] text-[var(--menu-muted)] hover:text-[var(--menu-text)]",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
