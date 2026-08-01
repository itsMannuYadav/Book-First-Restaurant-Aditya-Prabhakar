"use client";

import { useEffect, useState } from "react";
import type { MenuCategory } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: MenuCategory[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    for (const category of categories) {
      const el = document.getElementById(category.id ?? "");
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  return (
    <nav
      className="sticky top-[57px] z-30 mt-3 border-b border-[var(--menu-border-muted)] bg-[var(--menu-page)]/95 px-5 py-2.5 backdrop-blur-md transition-colors duration-350"
      aria-label="Menu categories"
    >
      <div className="mx-auto flex max-w-[900px] gap-2.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const id = category.id ?? "";
          const isActive = activeId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveId(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "shrink-0 border-b-2 px-4 py-2 text-[0.92rem] font-semibold whitespace-nowrap transition-all duration-250",
                isActive
                  ? "border-[var(--menu-accent)] text-[var(--menu-accent)]"
                  : "border-transparent text-[var(--menu-muted)] hover:text-[var(--menu-text)]",
              )}
            >
              {category.icon ? `${category.icon} ` : null}
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
