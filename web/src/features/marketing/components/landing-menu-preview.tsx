"use client";

import { useState } from "react";
import type { MenuThemeId } from "@/types";
import { cn } from "@/lib/utils";

const THEMES: Array<{
  id: MenuThemeId;
  label: string;
}> = [
  { id: "dark", label: "Dark Luxury" },
  { id: "rustic", label: "Rustic" },
  { id: "minimal", label: "Minimal" },
];

const PREVIEW_ITEMS = [
  ["Cappuccino", "₹ 180"],
  ["Gold Leaf Latte", "₹ 240"],
  ["Truffle Crostini", "₹ 320"],
] as const;

const THEME_STYLES: Record<
  MenuThemeId,
  {
    shell: string;
    border: string;
    muted: string;
    text: string;
    accent: string;
    card: string;
    pillIdle: string;
    logo: string;
    nameClass: string;
  }
> = {
  dark: {
    shell: "bg-[#0b0b0d]",
    border: "border-white/10",
    muted: "text-white/45",
    text: "text-[#f4f4f6]",
    accent: "text-[#e6c875]",
    card: "border-white/8 bg-white/[0.03]",
    pillIdle: "bg-white/5 text-white/40",
    logo: "border-[#d4af37]/40 bg-black/40 text-[#e6c875]",
    nameClass: "bf-gold-text",
  },
  rustic: {
    shell: "bg-[#f5ede0]",
    border: "border-[#d9c3b0]",
    muted: "text-[#6e5444]",
    text: "text-[#2c1a11]",
    accent: "text-[#a64b2a]",
    card: "border-[#e8dccf] bg-[#faf4eb]",
    pillIdle: "bg-[#4a301e]/8 text-[#6e5444]",
    logo: "border-[#a64b2a]/40 bg-[#faf4eb] text-[#a64b2a]",
    nameClass: "text-[#a64b2a]",
  },
  minimal: {
    shell: "bg-[#f8fafc]",
    border: "border-[#e2e8f0]",
    muted: "text-[#64748b]",
    text: "text-[#0f172a]",
    accent: "text-[#2563eb]",
    card: "border-[#e2e8f0] bg-white",
    pillIdle: "bg-[#f1f5f9] text-[#64748b]",
    logo: "border-[#0f172a]/20 bg-white text-[#0f172a]",
    nameClass: "text-[#0f172a]",
  },
};

export function LandingMenuPreview() {
  const [theme, setTheme] = useState<MenuThemeId>("rustic");
  const styles = THEME_STYLES[theme];

  return (
    <aside
      className="bf-fade-up-delay-2 bf-float relative mx-auto w-full max-w-[340px] lg:mx-0 lg:justify-self-end"
      aria-label="Interactive menu theme preview"
    >
      <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.2),transparent_65%)] blur-2xl" />
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border shadow-[0_40px_80px_rgba(0,0,0,0.55)] transition-colors duration-350",
          styles.shell,
          styles.border,
        )}
      >
        <div className={cn("border-b px-4 py-3", styles.border)}>
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-current opacity-20" />
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Preview theme"
          >
            {THEMES.map((option) => {
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all duration-250",
                    active
                      ? option.id === "dark"
                        ? "bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0b0d] shadow-sm"
                        : option.id === "rustic"
                          ? "bg-[#7a3e22] text-[#fffdf9] shadow-sm"
                          : "bg-[#0f172a] text-white shadow-sm"
                      : cn(styles.pillIdle, "hover:opacity-80"),
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 pt-6 pb-4 text-center">
          <div
            className={cn(
              "mx-auto mb-3 flex size-14 items-center justify-center rounded-full border font-[family-name:var(--font-serif-display)] text-xl transition-colors duration-350",
              styles.logo,
            )}
          >
            A
          </div>
          <p
            className={cn(
              "font-[family-name:var(--font-serif-display)] text-2xl font-bold transition-colors duration-350",
              styles.nameClass,
            )}
          >
            Cafe Aroma
          </p>
          <p className={cn("mt-1 text-xs transition-colors duration-350", styles.muted)}>
            Crafted Flavors · Specialty Brews
          </p>
        </div>

        <div className="space-y-2.5 px-4 pb-6">
          {PREVIEW_ITEMS.map(([name, price]) => (
            <div
              key={name}
              className={cn(
                "rounded-xl border px-3.5 py-3 transition-colors duration-350",
                styles.card,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors duration-350",
                    styles.text,
                  )}
                >
                  {name}
                </p>
                <p
                  className={cn(
                    "font-[family-name:var(--font-serif-display)] text-sm font-bold transition-colors duration-350",
                    styles.accent,
                  )}
                >
                  {price}
                </p>
              </div>
              <p
                className={cn(
                  "mt-1 text-[11px] leading-snug opacity-80 transition-colors duration-350",
                  styles.muted,
                )}
              >
                Signature preparation, ready for the table.
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
