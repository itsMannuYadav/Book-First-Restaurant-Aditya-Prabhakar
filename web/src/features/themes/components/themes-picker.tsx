"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { MENU_THEMES } from "@/constants/menu-themes";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import type { MenuThemeId } from "@/types";
import { cn } from "@/lib/utils";

export function ThemesPicker() {
  const { restaurant, loading, saveTheme } = useOwnerRestaurant();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<MenuThemeId | null>(null);

  const current = selected ?? restaurant?.theme ?? "dark";

  if (loading || !restaurant) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  async function onSave() {
    setPending(true);
    try {
      await saveTheme(current);
      toast.success("Theme saved");
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Appearance"
        title="Themes"
        description="Choose how your public menu looks to guests."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MENU_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelected(theme.id)}
            className={cn(
              "rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5",
              current === theme.id
                ? "border-[#14110e] bg-white shadow-md ring-2 ring-[#14110e]/10"
                : "border-[#14110e]/10 bg-white/70 hover:border-[#14110e]/25",
            )}
          >
            <div
              className={cn(
                "mb-4 h-16 rounded-2xl",
                theme.id === "dark" &&
                  "bg-gradient-to-br from-[#0b0b0d] to-[#2a2418]",
                theme.id === "rustic" &&
                  "bg-gradient-to-br from-[#7a3e22] to-[#f5ede0]",
                theme.id === "minimal" &&
                  "bg-gradient-to-br from-[#e2e8f0] to-[#0f172a]",
                theme.id === "savan" &&
                  "bg-gradient-to-br from-[#062316] via-[#15803d] to-[#86efac]",
              )}
            />
            <p className="font-semibold text-[#14110e]">{theme.label}</p>
            <p className="mt-1 text-sm text-[#7a7164]">
              {theme.id === "dark" && "Gold accents on deep charcoal."}
              {theme.id === "rustic" && "Warm wood tones and cream surfaces."}
              {theme.id === "minimal" && "Clean white with crisp navy accents."}
              {theme.id === "savan" && "Lush green tones, rain & leaves."}
            </p>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
        )}
        disabled={pending}
        onClick={() => void onSave()}
      >
        {pending ? "Saving…" : "Save theme"}
      </button>
    </div>
  );
}
