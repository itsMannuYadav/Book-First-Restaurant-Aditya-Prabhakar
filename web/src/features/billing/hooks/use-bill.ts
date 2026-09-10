"use client";

import { useCallback, useEffect, useState } from "react";
import { getBill } from "@/lib/firebase/bills";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import type { Bill } from "@/types";

export function useBill(billId: string) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getBill(billId);
      setBill(next);
      setError(next ? null : "This bill was not found.");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch bill on mount
    void refresh();
  }, [refresh]);

  return { bill, loading, error, refresh, setBill };
}
