"use client";

import { useCallback, useMemo, useState } from "react";
import type { DietFilter, MenuItem, MenuThemeId, PublicMenuData } from "@/types";
import { filterCategories } from "@/features/menu-public/lib/filter-menu";

export interface SelectionLine {
  item: MenuItem;
  quantity: number;
}

export function usePublicMenu(menu: PublicMenuData) {
  const [theme, setTheme] = useState<MenuThemeId>(menu.restaurant.theme);
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const filteredCategories = useMemo(
    () => filterCategories(menu.categories, dietFilter, searchQuery),
    [menu.categories, dietFilter, searchQuery],
  );

  const itemLookup = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const category of menu.categories) {
      for (const item of category.items) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [menu.categories]);

  const selectionLines = useMemo((): SelectionLine[] => {
    return Object.entries(selection)
      .map(([id, quantity]) => {
        const item = itemLookup.get(id);
        if (!item || quantity <= 0) return null;
        return { item, quantity };
      })
      .filter((line): line is SelectionLine => line !== null);
  }, [selection, itemLookup]);

  const selectionCount = useMemo(
    () => selectionLines.reduce((sum, line) => sum + line.quantity, 0),
    [selectionLines],
  );

  const selectionTotal = useMemo(
    () =>
      selectionLines.reduce(
        (sum, line) => sum + line.item.price * line.quantity,
        0,
      ),
    [selectionLines],
  );

  const addItem = useCallback((itemId: string) => {
    setSelection((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setSelection((prev) => {
      const next = { ...prev };
      const current = next[itemId] ?? 0;
      if (current <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = current - 1;
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({});
    setIsSelectionOpen(false);
  }, []);

  return {
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
  };
}
