"use client";

import { useEffect, useState } from "react";
import demoMenu from "@/data/demo-menu.json";
import { PublicMenuView } from "@/features/menu-public";
import { getPublicMenuBySlug } from "@/lib/firebase/public-menu";
import { mapDemoMenuToPublic } from "@/lib/mappers/menu";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { slugify } from "@/lib/utils/string";
import type { DemoMenuJson, PublicMenuData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicMenuError } from "@/features/menu-public/components/public-menu-error";

const DEMO_SLUG = "cafe-aroma";

interface PublicMenuLoaderProps {
  slug: string;
}

function getDemoMenu(slug: string): PublicMenuData {
  return mapDemoMenuToPublic(demoMenu as DemoMenuJson, slug);
}

export function PublicMenuLoader({ slug }: PublicMenuLoaderProps) {
  const normalizedSlug = slugify(slug) || slug;
  const isDemo = normalizedSlug === DEMO_SLUG;
  const [menu, setMenu] = useState<PublicMenuData | null>(
    isDemo ? getDemoMenu(DEMO_SLUG) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      setMenu(getDemoMenu(DEMO_SLUG));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured()) {
        if (!cancelled) {
          setError("Firebase is not configured in this environment.");
          setLoading(false);
        }
        return;
      }

      try {
        const remote = await getPublicMenuBySlug(normalizedSlug);
        if (cancelled) return;

        if (remote) {
          setMenu(remote);
        } else {
          setMenu(null);
          setError(
            "This menu was not found. Check the link, or ask the restaurant to publish it.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMenu(null);
          setError(getFirebaseErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedSlug, isDemo]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] space-y-4 px-5 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !menu) {
    return <PublicMenuError message={error ?? "Menu not found"} />;
  }

  return <PublicMenuView menu={menu} />;
}
