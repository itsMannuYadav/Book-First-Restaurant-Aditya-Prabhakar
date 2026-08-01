"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  createRestaurant,
  getRestaurantByOwnerId,
  normalizeRestaurantSlug,
  updateRestaurant,
  updateRestaurantTheme,
} from "@/lib/firebase/restaurants";
import type { Restaurant } from "@/types";
import type { MenuThemeId } from "@/types";
import type { RestaurantInput } from "@/lib/validators/forms";

export function useOwnerRestaurant() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let next = await getRestaurantByOwnerId(user.uid);
      if (!next) {
        next = await createRestaurant({
          ownerId: user.uid,
          name: user.displayName || "My Restaurant",
        });
      } else {
        next = await normalizeRestaurantSlug(next);
      }
      setRestaurant(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: RestaurantInput) => {
      if (!restaurant) return;
      await updateRestaurant(restaurant.id, input);
      await refresh();
    },
    [restaurant, refresh],
  );

  const saveTheme = useCallback(
    async (theme: MenuThemeId) => {
      if (!restaurant) return;
      await updateRestaurantTheme(restaurant.id, theme);
      await refresh();
    },
    [restaurant, refresh],
  );

  return {
    restaurant,
    loading,
    error,
    refresh,
    save,
    saveTheme,
  };
}
