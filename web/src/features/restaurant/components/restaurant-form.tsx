"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { HoursPicker } from "@/components/shared/hours-picker";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { restaurantSchema } from "@/lib/validators/forms";
import { slugify } from "@/lib/utils/string";
import { formatHours, DEFAULT_HOURS } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";
import { MENU_THEMES } from "@/constants/menu-themes";
import type { MenuThemeId } from "@/types";
import type { RestaurantStatus } from "@/types";

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  timing: string;
  currency: string;
  theme: MenuThemeId;
  status: RestaurantStatus;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-[#8a8173]">{children}</p>;
}

export function RestaurantForm() {
  const { restaurant, loading, error, save } = useOwnerRestaurant();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    tagline: "Fresh flavors · Warm hospitality · Made with care",
    description:
      "Welcome to our kitchen. Update this text with your story, specialties, and what guests should try first.",
    address: "Add your street address here",
    phone: "+91 98765 43210",
    timing: formatHours(DEFAULT_HOURS),
    currency: "₹",
    theme: "rustic",
    status: "draft",
  });

  useEffect(() => {
    if (!restaurant) return;
    setForm({
      name: restaurant.name,
      slug: slugify(restaurant.slug) || restaurant.slug.toLowerCase(),
      tagline:
        restaurant.tagline ||
        "Fresh flavors · Warm hospitality · Made with care",
      description:
        restaurant.description ||
        "Welcome to our kitchen. Update this text with your story, specialties, and what guests should try first.",
      address: restaurant.address || "Add your street address here",
      phone: restaurant.phone || "+91 98765 43210",
      timing: restaurant.timing || formatHours(DEFAULT_HOURS),
      currency: restaurant.currency || "₹",
      theme: restaurant.theme,
      status: restaurant.status,
    });
  }, [restaurant]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const normalized = {
      ...form,
      name: form.name.trim(),
      slug: slugify(form.slug),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      timing: form.timing.trim(),
      currency: form.currency.trim() || "₹",
    };

    const parsed = restaurantSchema.safeParse(normalized);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in nextErrors)) {
          nextErrors[key as keyof FormState] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setForm((prev) => ({ ...prev, slug: normalized.slug }));
      toast.error(
        parsed.error.issues[0]?.message ?? "Please fix the highlighted fields",
      );
      return;
    }

    setPending(true);
    try {
      await save(parsed.data);
      setForm((prev) => ({ ...prev, ...parsed.data }));
      toast.success("Restaurant profile saved");
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-6" onSubmit={onSubmit}>
      <PageHeader
        eyebrow="Profile"
        title="Restaurant"
        description="We've prefilled example details — edit anything to match your restaurant."
      />

      <div className="rounded-2xl border border-[#14110e]/8 bg-[#14110e]/[0.03] px-4 py-3 text-sm text-[#5c554a]">
        Tip: keep Visibility on <strong>Draft</strong> while you edit. Switch to{" "}
        <strong>Published</strong> when you’re ready for guests to scan the QR.
      </div>

      <div className="grid gap-5 rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Restaurant name</Label>
          <Input
            id="name"
            placeholder="e.g. Mannu Restaurant"
            value={form.name}
            aria-invalid={Boolean(fieldErrors.name)}
            onChange={(e) => {
              const name = e.target.value;
              setForm((prev) => ({
                ...prev,
                name,
                slug:
                  prev.slug === slugify(prev.name) || !prev.slug
                    ? slugify(name)
                    : prev.slug,
              }));
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
          <FieldHint>Shown as the big title on your public menu.</FieldHint>
          {fieldErrors.name ? (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">Menu link (URL)</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-[#8a8173]">/m/</span>
            <Input
              id="slug"
              placeholder="mannu-restaurants"
              value={form.slug}
              aria-invalid={Boolean(fieldErrors.slug)}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                setFieldErrors((prev) => ({ ...prev, slug: undefined }));
              }}
              onBlur={() =>
                setForm((prev) => ({ ...prev, slug: slugify(prev.slug) }))
              }
            />
          </div>
          <FieldHint>
            Lowercase letters, numbers, and hyphens only. Example:{" "}
            <span className="font-medium text-[#14110e]">mannu-restaurants</span>
          </FieldHint>
          <p className="text-xs text-[#5c554a]">
            Guests open{" "}
            <span className="font-medium">
              /m/{form.slug || "mannu-restaurants"}
            </span>
          </p>
          {fieldErrors.slug ? (
            <p className="text-xs text-destructive">{fieldErrors.slug}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="Fresh flavors · Warm hospitality · Made with care"
            value={form.tagline}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tagline: e.target.value }))
            }
          />
          <FieldHint>One short line under your restaurant name.</FieldHint>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">About your restaurant</Label>
          <Textarea
            id="description"
            placeholder="Welcome to our kitchen. Share your story, specialties, and must-try dishes."
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-24"
          />
          <FieldHint>Optional. Edit the sample text to match your brand.</FieldHint>
        </div>

        <HoursPicker
          value={form.timing}
          onChange={(timing) => setForm((prev) => ({ ...prev, timing }))}
        />

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency symbol</Label>
          <Input
            id="currency"
            placeholder="₹"
            value={form.currency}
            aria-invalid={Boolean(fieldErrors.currency)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currency: e.target.value }))
            }
          />
          <FieldHint>Used next to prices on the menu.</FieldHint>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="45 MG Road, Your City"
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Menu theme</Label>
          <select
            id="theme"
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            value={form.theme}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                theme: e.target.value as MenuThemeId,
              }))
            }
          >
            {MENU_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
          <FieldHint>You can change this anytime under Themes.</FieldHint>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Visibility</Label>
          <select
            id="status"
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as RestaurantStatus,
              }))
            }
          >
            <option value="draft">Draft — only people with the link</option>
            <option value="published">Published — ready for QR guests</option>
            <option value="archived">Archived — hidden</option>
          </select>
          <FieldHint>
            Use Draft while building. Publish when the menu looks ready.
          </FieldHint>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants({ size: "lg" }),
          "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
        )}
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
