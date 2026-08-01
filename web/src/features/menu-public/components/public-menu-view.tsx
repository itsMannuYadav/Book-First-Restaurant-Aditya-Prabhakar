"use client";

import type { PublicMenuData } from "@/types";
import { usePublicMenu } from "@/features/menu-public/hooks/use-public-menu";
import { MenuTopBar } from "@/features/menu-public/components/menu-top-bar";
import { MenuHero } from "@/features/menu-public/components/menu-hero";
import { DietFilterPills } from "@/features/menu-public/components/diet-filter-pills";
import { CategoryNav } from "@/features/menu-public/components/category-nav";
import { CategorySection } from "@/features/menu-public/components/category-section";
import { SelectionBar } from "@/features/menu-public/components/selection-bar";
import { SavanOverlay } from "@/features/menu-public/components/savan-overlay";

interface PublicMenuViewProps {
  menu: PublicMenuData;
}

export function PublicMenuView({ menu }: PublicMenuViewProps) {
  const {
    theme,
    setTheme,
    dietFilter,
    setDietFilter,
    searchQuery,
    setSearchQuery,
    filteredCategories,
    selection,
    selectionLines,
    selectionCount,
    selectionTotal,
    addItem,
    removeItem,
    clearSelection,
    isSelectionOpen,
    setIsSelectionOpen,
  } = usePublicMenu(menu);

  const { restaurant } = menu;

  return (
    <div
      data-menu-theme={theme}
      className="menu-shell relative min-h-screen bg-[var(--menu-page)] pb-36 text-[var(--menu-text)] transition-colors duration-350 overflow-hidden"
    >
      {theme === "savan" && <SavanOverlay />}
      <MenuTopBar
        theme={theme}
        onThemeChange={setTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <MenuHero
        name={restaurant.name}
        tagline={restaurant.tagline}
        logoUrl={restaurant.logoUrl}
        coverUrl={restaurant.coverUrl}
        rating={restaurant.rating}
        timing={restaurant.timing}
        address={restaurant.address}
      />

      <DietFilterPills value={dietFilter} onChange={setDietFilter} />
      <CategoryNav categories={filteredCategories} />

      <main className="mx-auto mt-6 max-w-[900px] px-5">
        {filteredCategories.length === 0 ? (
          <p className="px-5 py-10 text-center text-[1.05rem] text-[var(--menu-muted)]">
            No menu items match your search criteria.
          </p>
        ) : (
          filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              currency={restaurant.currency}
              selection={selection}
              onAdd={addItem}
            />
          ))
        )}
      </main>

      <SelectionBar
        restaurant={restaurant}
        count={selectionCount}
        total={selectionTotal}
        currency={restaurant.currency}
        lines={selectionLines}
        isOpen={isSelectionOpen}
        onOpenChange={setIsSelectionOpen}
        onClear={clearSelection}
        onIncrement={addItem}
        onDecrement={removeItem}
      />
    </div>
  );
}
