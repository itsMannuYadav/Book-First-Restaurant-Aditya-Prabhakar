"use client";

import { useEffect, useState } from "react";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { subscribeOwnerBills } from "@/lib/firebase/bills";
import type { Bill } from "@/types";

export function useBills() {
  const { restaurant, loading: restaurantLoading } = useOwnerRestaurant();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while re-subscribing
    setLoading(true);
    const unsub = subscribeOwnerBills(
      restaurant.id,
      (next) => {
        setBills(next);
        setLoading(false);
        setError(null);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [restaurant?.id]);

  return { restaurant, restaurantLoading, bills, loading, error };
}
