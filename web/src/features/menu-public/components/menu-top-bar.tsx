"use client";

import { Search } from "lucide-react";
import { MENU_THEMES } from "@/constants/menu-themes";
import type { MenuThemeId } from "@/types";
import { cn } from "@/lib/utils";

interface MenuTopBarProps {
  theme: MenuThemeId;
  onThemeChange: (theme: MenuThemeId) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function MenuTopBar({
  theme,
  onThemeChange,
  searchQuery,
  onSearchChange,
}: MenuTopBarProps) {
  return (
    <div className="menu-top-bar sticky top-0 z-50 border-b border-[var(--menu-border-muted)] bg-[var(--menu-surface)]/90 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 rounded-full border border-[var(--menu-border-muted)] bg-[var(--menu-pill)] p-1"
          role="group"
          aria-label="Menu theme"
        >
          {MENU_THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onThemeChange(option.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-250",
                theme === option.id
                  ? "bg-[image:var(--menu-pill-active)] text-[var(--menu-pill-active-text)] shadow-md"
                  : "text-[var(--menu-muted)] hover:text-[var(--menu-text)]",
              )}
              aria-pressed={theme === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search menu</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--menu-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search menu items or ingredients..."
            className="w-full rounded-full border border-[var(--menu-border-muted)] bg-[var(--menu-pill)] py-2 pr-4 pl-9 text-sm text-[var(--menu-text)] outline-none transition-all placeholder:text-[var(--menu-muted)] focus:border-[var(--menu-accent)] focus:shadow-[0_0_0_3px_var(--menu-accent-glow)]"
          />
        </label>
      </div>
    </div>
  );
}
