"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, MapPin, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { HoursPicker } from "@/components/shared/hours-picker";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import {
  deleteRestaurantLogo,
  uploadRestaurantLogo,
  validateRestaurantImage,
} from "@/lib/firebase/storage";
import { restaurantSchema } from "@/lib/validators/forms";
import type { RestaurantInput } from "@/lib/validators/forms";
import { slugify } from "@/lib/utils/string";
import { formatHours, DEFAULT_HOURS } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";
import {
  LOGO_UPLOADS_ENABLED,
  LOGO_UPLOADS_UNAVAILABLE_MESSAGE,
} from "@/constants/features";
import { MENU_THEMES } from "@/constants/menu-themes";
import { DEFAULT_ORDER_GEO_RADIUS_METERS } from "@/constants/orders";
import type { MenuThemeId, Restaurant } from "@/types";
import type { RestaurantStatus, RestaurantTable } from "@/types";

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  address: string;
  phone: string;
  timing: string;
  currency: string;
  theme: MenuThemeId;
  status: RestaurantStatus;
  lat: string;
  lng: string;
  orderGeoRadiusMeters: string;
  requireGuestGps: boolean;
  orderingEnabled: boolean;
  tables: RestaurantTable[];
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-[#8a8173]">{children}</p>;
}

function newTableId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tbl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function restaurantToForm(restaurant: Restaurant): FormState {
  return {
    name: restaurant.name,
    slug: slugify(restaurant.slug) || restaurant.slug.toLowerCase(),
    tagline:
      restaurant.tagline ||
      "Fresh flavors · Warm hospitality · Made with care",
    description:
      restaurant.description ||
      "Welcome to our kitchen. Update this text with your story, specialties, and what guests should try first.",
    logoUrl: restaurant.logoUrl || "",
    address: restaurant.address || "Add your street address here",
    phone: restaurant.phone || "+91 98765 43210",
    timing: restaurant.timing || formatHours(DEFAULT_HOURS),
    currency: restaurant.currency || "₹",
    theme: restaurant.theme,
    status: restaurant.status,
    lat: restaurant.location ? String(restaurant.location.lat) : "",
    lng: restaurant.location ? String(restaurant.location.lng) : "",
    orderGeoRadiusMeters: String(
      restaurant.orderGeoRadiusMeters || DEFAULT_ORDER_GEO_RADIUS_METERS,
    ),
    requireGuestGps: restaurant.requireGuestGps !== false,
    orderingEnabled: restaurant.orderingEnabled,
    tables: restaurant.tables ?? [],
  };
}

export function RestaurantForm() {
  const { restaurant, loading, error, save, saveLogo } = useOwnerRestaurant();

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

  if (!restaurant) return null;

  return (
    <RestaurantFormFields
      key={`${restaurant.id}:${restaurant.updatedAt}`}
      restaurantId={restaurant.id}
      save={save}
      saveLogo={saveLogo}
      initial={restaurantToForm(restaurant)}
    />
  );
}

function RestaurantFormFields({
  restaurantId,
  save,
  saveLogo,
  initial,
}: {
  restaurantId: string;
  save: (input: RestaurantInput) => Promise<void>;
  saveLogo: (logoUrl: string) => Promise<void>;
  initial: FormState;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [locating, setLocating] = useState(false);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>(initial);

  const activeTableCount = useMemo(
    () => form.tables.filter((t) => t.isActive).length,
    [form.tables],
  );

  const hasPin = Boolean(form.lat.trim() && form.lng.trim());
  const canEnableOrdering =
    activeTableCount > 0 && (!form.requireGuestGps || hasPin);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn’t supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success("Venue pin set from your current location");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enter coordinates manually."
            : "Couldn’t read your location. Enter coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function addTable() {
    const label = newTableLabel.trim();
    if (!label) {
      toast.error("Enter a table or seat label first");
      return;
    }
    if (form.tables.some((t) => t.label.toLowerCase() === label.toLowerCase() && t.isActive)) {
      toast.error("That table label already exists");
      return;
    }
    setForm((prev) => ({
      ...prev,
      tables: [...prev.tables, { id: newTableId(), label, isActive: true }],
    }));
    setNewTableLabel("");
  }

  function deactivateTable(id: string) {
    setForm((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === id ? { ...t, isActive: false } : t,
      ),
    }));
  }

  function renameTable(id: string, label: string) {
    setForm((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => (t.id === id ? { ...t, label } : t)),
    }));
  }

  function notifyLogoUnavailable() {
    toast.message("Logo upload coming soon", {
      description: LOGO_UPLOADS_UNAVAILABLE_MESSAGE,
      duration: 6000,
    });
  }

  async function onLogoSelected(file: File | undefined) {
    if (!file) return;
    if (!LOGO_UPLOADS_ENABLED) {
      notifyLogoUnavailable();
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validationError = validateRestaurantImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadRestaurantLogo(restaurantId, file);
      await saveLogo(logoUrl);
      setForm((prev) => ({ ...prev, logoUrl }));
      toast.success("Logo updated — it will show on your public menu");
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeLogo() {
    if (!LOGO_UPLOADS_ENABLED) {
      notifyLogoUnavailable();
      return;
    }

    setUploadingLogo(true);
    try {
      await deleteRestaurantLogo(restaurantId);
      await saveLogo("");
      setForm((prev) => ({ ...prev, logoUrl: "" }));
      toast.success("Logo removed");
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const latNum = form.lat.trim() ? Number(form.lat) : NaN;
    const lngNum = form.lng.trim() ? Number(form.lng) : NaN;
    const hasCoords = form.lat.trim() !== "" && form.lng.trim() !== "";

    const location =
      hasCoords && Number.isFinite(latNum) && Number.isFinite(lngNum)
        ? { lat: latNum, lng: lngNum }
        : null;

    const normalized = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      logoUrl: form.logoUrl.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      timing: form.timing.trim(),
      currency: form.currency.trim() || "₹",
      theme: form.theme,
      status: form.status,
      location,
      orderGeoRadiusMeters: Number(form.orderGeoRadiusMeters) || DEFAULT_ORDER_GEO_RADIUS_METERS,
      requireGuestGps: form.requireGuestGps,
      orderingEnabled:
        form.orderingEnabled &&
        activeTableCount > 0 &&
        (!form.requireGuestGps || Boolean(location)),
      tables: form.tables.map((t) => ({
        ...t,
        label: t.label.trim(),
      })),
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
      await save({
        ...parsed.data,
        location: parsed.data.location ?? null,
      });
      setForm((prev) => ({
        ...prev,
        ...parsed.data,
        lat: parsed.data.location ? String(parsed.data.location.lat) : "",
        lng: parsed.data.location ? String(parsed.data.location.lng) : "",
        orderGeoRadiusMeters: String(parsed.data.orderGeoRadiusMeters),
        requireGuestGps: parsed.data.requireGuestGps,
        orderingEnabled: parsed.data.orderingEnabled,
        tables: parsed.data.tables,
      }));
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
        <div className="space-y-3 sm:col-span-2">
          <Label>Restaurant logo</Label>
          {!LOGO_UPLOADS_ENABLED ? (
            <div
              role="status"
              className="rounded-2xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <p className="font-semibold">Logo upload coming soon</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-950/80">
                Image storage isn’t enabled on this project yet. Guests will see
                your restaurant’s letter mark for now — uploading a custom logo
                will unlock once setup is finished.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="Restaurant logo preview"
                className="size-20 rounded-full border border-[#14110e]/10 object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex size-20 items-center justify-center rounded-full border border-dashed border-[#14110e]/20 bg-[#faf7f1] text-lg font-semibold text-[#8a8173]"
                aria-hidden
              >
                {(form.name.trim().slice(0, 1) || "?").toUpperCase()}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={!LOGO_UPLOADS_ENABLED}
                onChange={(e) => void onLogoSelected(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploadingLogo || pending}
                onClick={() => {
                  if (!LOGO_UPLOADS_ENABLED) {
                    notifyLogoUnavailable();
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "gap-2 border-[#14110e]/10",
                  !LOGO_UPLOADS_ENABLED && "opacity-70",
                )}
              >
                <ImagePlus className="size-4" />
                {uploadingLogo
                  ? "Uploading…"
                  : !LOGO_UPLOADS_ENABLED
                    ? "Upload logo (soon)"
                    : form.logoUrl
                      ? "Change logo"
                      : "Upload logo"}
              </button>
              {form.logoUrl && LOGO_UPLOADS_ENABLED ? (
                <button
                  type="button"
                  disabled={uploadingLogo || pending}
                  onClick={() => void removeLogo()}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "gap-2 text-[#8a8173]",
                  )}
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <FieldHint>
            {LOGO_UPLOADS_ENABLED
              ? "Square works best. Shown as the circle mark on your public menu. JPG, PNG, WebP, or GIF — up to 2 MB."
              : "When this is ready, a square logo works best on your public menu."}
          </FieldHint>
        </div>

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

      <div className="grid gap-5 rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-[#14110e]">
            Dine-in ordering
          </h2>
          <p className="mt-1 text-sm text-[#7a7164]">
            Guests can place table tickets only when they are near your venue.
            Set a pin, add tables, then turn ordering on.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              inputMode="decimal"
              placeholder="28.613900"
              value={form.lat}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lat: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              inputMode="decimal"
              placeholder="77.209000"
              value={form.lng}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lng: e.target.value }))
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-center gap-2 border-[#14110e]/10 sm:w-auto",
          )}
        >
          <MapPin className="size-4" />
          {locating ? "Reading location…" : "Use my current location"}
        </button>
        <FieldHint>
          Stand inside your restaurant and tap this so the pin matches your
          venue. Guests farther than the radius below cannot order.
        </FieldHint>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="radius">Order radius (meters)</Label>
          <Input
            id="radius"
            type="number"
            min={30}
            max={500}
            value={form.orderGeoRadiusMeters}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                orderGeoRadiusMeters: e.target.value,
              }))
            }
          />
          <FieldHint>Default 120m. Increase slightly for large venues.</FieldHint>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#14110e]/10 bg-[#faf7f1] px-4 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.requireGuestGps}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                requireGuestGps: e.target.checked,
              }))
            }
          />
          <span>
            <span className="block text-sm font-semibold text-[#14110e]">
              Require guest GPS (recommended)
            </span>
            <span className="mt-0.5 block text-xs text-[#7a7164]">
              Guests must be near your venue pin to order. Turn this off only if
              indoor GPS is unreliable — anyone with the menu link can then place
              tickets from elsewhere (you can still decline them).
            </span>
          </span>
        </label>

        {!form.requireGuestGps ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-xs text-amber-950">
            GPS check is off. Keep confirming orders carefully — prank tickets
            from outside the restaurant become easier.
          </div>
        ) : null}

        <div className="space-y-3 border-t border-[#14110e]/8 pt-4">
          <Label>Tables & seats</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Table 7 or Patio A"
              value={newTableLabel}
              onChange={(e) => setNewTableLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTable();
                }
              }}
            />
            <button
              type="button"
              onClick={addTable}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 gap-1 border-[#14110e]/10",
              )}
            >
              <Plus className="size-4" />
              Add
            </button>
          </div>
          <FieldHint>
            Guests must pick from this list. Deactivate instead of deleting so
            past orders keep their labels.
          </FieldHint>

          {form.tables.filter((t) => t.isActive).length === 0 ? (
            <p className="text-sm text-[#8a8173]">No active tables yet.</p>
          ) : (
            <ul className="space-y-2">
              {form.tables
                .filter((t) => t.isActive)
                .map((table) => (
                  <li
                    key={table.id}
                    className="flex items-center gap-2 rounded-xl border border-[#14110e]/8 bg-[#faf7f1] px-3 py-2"
                  >
                    <Input
                      value={table.label}
                      onChange={(e) => renameTable(table.id, e.target.value)}
                      className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      aria-label={`Deactivate ${table.label}`}
                      onClick={() => deactivateTable(table.id)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-8 shrink-0 text-[#8a8173]",
                      )}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3",
            canEnableOrdering
              ? "border-[#14110e]/10 bg-[#faf7f1]"
              : "border-dashed border-[#14110e]/15 bg-transparent opacity-80",
          )}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={form.orderingEnabled && canEnableOrdering}
            disabled={!canEnableOrdering}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                orderingEnabled: e.target.checked,
              }))
            }
          />
          <span>
            <span className="block text-sm font-semibold text-[#14110e]">
              Enable dine-in ordering
            </span>
            <span className="mt-0.5 block text-xs text-[#7a7164]">
              {canEnableOrdering
                ? form.requireGuestGps
                  ? "Guests on your published menu can place table tickets when they are nearby."
                  : "Guests can place table tickets without a location check."
                : form.requireGuestGps
                  ? "Add a venue pin and at least one active table first."
                  : "Add at least one active table first."}
            </span>
          </span>
        </label>
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
