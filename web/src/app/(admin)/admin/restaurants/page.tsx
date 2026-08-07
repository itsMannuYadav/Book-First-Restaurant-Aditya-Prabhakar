"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { ROUTES } from "@/constants/routes";
import type { Restaurant } from "@/types";

type RestaurantRow = Restaurant & { ownerEmail?: string };

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const data = await adminFetch<{ restaurants: RestaurantRow[] }>(
        `/api/admin/restaurants${params}`,
      );
      setRestaurants(data.restaurants);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError
          ? err.message
          : "Failed to load restaurants",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void refresh();
  }, [refresh]);

  return (
    <div>
      <PageHeader
        title="Restaurants"
        description="Search and open any venue to edit profile or bulk-upload menu."
      />

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void refresh(query);
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug, email…"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#14110e] px-4 text-sm font-medium text-[#f4efe6]"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[#14110e]/8 overflow-hidden rounded-2xl border border-[#14110e]/8 bg-white">
          {restaurants.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[#7a7164]">No matches.</li>
          ) : (
            restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Link
                  href={ROUTES.adminRestaurant(restaurant.id)}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-[#14110e]/[0.03]"
                >
                  <div>
                    <p className="font-medium text-[#14110e]">
                      {restaurant.name}
                    </p>
                    <p className="text-xs text-[#7a7164]">
                      /m/{restaurant.slug}
                      {restaurant.ownerEmail
                        ? ` · ${restaurant.ownerEmail}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#5c554a]">
                    {restaurant.approvalStatus} · {restaurant.status}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
