"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { auth } from "@/lib/firebase/client";
import { CSV_MENU_TEMPLATE } from "@/lib/admin/csv-menu-shared";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Category, MenuItemRecord } from "@/types";

const TAG_OPTIONS = [
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non-veg" },
  { id: "vegan", label: "Vegan" },
  { id: "gf", label: "Gluten-free" },
] as const;

type ItemForm = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  badge: string;
  tags: string[];
  isAvailable: boolean;
};

const emptyItem: ItemForm = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  badge: "",
  tags: [],
  isAvailable: true,
};

export default function AdminRestaurantMenuPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState("");
  const [replaceMode, setReplaceMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [itemOpen, setItemOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemRecord | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [itemPending, setItemPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, menu] = await Promise.all([
        adminFetch<{ categories: Category[] }>(
          `/api/admin/restaurants/${id}/categories`,
        ),
        adminFetch<{ items: MenuItemRecord[] }>(
          `/api/admin/restaurants/${id}/menu-items`,
        ),
      ]);
      setCategories(cats.categories);
      setItems(menu.items);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to load menu",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void refresh();
  }, [refresh]);

  async function addCategory() {
    if (!categoryName.trim()) return;
    try {
      await adminFetch(`/api/admin/restaurants/${id}/categories`, {
        method: "POST",
        body: JSON.stringify({ name: categoryName.trim(), isVisible: true }),
      });
      setCategoryName("");
      toast.success("Category added");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to add category",
      );
    }
  }

  async function saveItem() {
    setItemPending(true);
    try {
      if (editing) {
        await adminFetch(
          `/api/admin/restaurants/${id}/menu-items/${editing.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(itemForm),
          },
        );
        toast.success("Item updated");
      } else {
        await adminFetch(`/api/admin/restaurants/${id}/menu-items`, {
          method: "POST",
          body: JSON.stringify(itemForm),
        });
        toast.success("Item added");
      }
      setItemOpen(false);
      setEditing(null);
      setItemForm(emptyItem);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to save item",
      );
    } finally {
      setItemPending(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this menu item?")) return;
    try {
      await adminFetch(`/api/admin/restaurants/${id}/menu-items/${itemId}`, {
        method: "DELETE",
      });
      toast.success("Item deleted");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to delete item",
      );
    }
  }

  async function onImport() {
    if (!csvText.trim()) {
      toast.error("Paste CSV or load a file first.");
      return;
    }
    if (
      replaceMode &&
      !confirm(
        "Replace mode deletes existing items in the CSV categories before importing. Continue?",
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      const result = await adminFetch<{
        createdCategories: number;
        createdItems: number;
        deletedItems: number;
        errors: Array<{ rowNumber: number; message: string }>;
      }>(`/api/admin/restaurants/${id}/menu/import`, {
        method: "POST",
        body: JSON.stringify({
          csvText,
          mode: replaceMode ? "replace" : "append",
        }),
      });
      if (result.errors.length > 0 && result.createdItems === 0) {
        toast.error(
          result.errors[0]?.message ?? "CSV validation failed",
        );
      } else {
        toast.success(
          `Imported ${result.createdItems} items` +
            (result.createdCategories
              ? `, ${result.createdCategories} categories`
              : "") +
            (result.deletedItems ? `, removed ${result.deletedItems}` : "") +
            (result.errors.length
              ? ` (${result.errors.length} row warnings)`
              : ""),
        );
      }
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Import failed",
      );
    } finally {
      setImporting(false);
    }
  }

  async function onExport() {
    try {
      if (!auth?.currentUser) throw new AdminApiError("Sign in required", 401);
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(
        `/api/admin/restaurants/${id}/menu/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new AdminApiError(
          json.message ?? "Export failed",
          response.status,
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Export failed",
      );
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Menu ops"
        description="Edit dishes or bulk import from CSV."
        action={
          <Link
            href={ROUTES.adminRestaurant(id)}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to restaurant
          </Link>
        }
      />

      <section className="mt-6 rounded-3xl border border-[#14110e]/8 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[#14110e]">CSV bulk upload</h2>
        <p className="mt-1 text-sm text-[#7a7164]">
          Columns: category, name, description, price, tags, badge, isAvailable,
          sortOrder. Tags use semicolon separators (veg;gf).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => setCsvText(CSV_MENU_TEMPLATE)}
          >
            Load template
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => void onExport()}
          >
            Export current menu
          </button>
          <label
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer",
            )}
          >
            Upload file
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <Textarea
          className="mt-4 min-h-40 font-mono text-xs"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste CSV here…"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-[#5c554a]">
          <input
            type="checkbox"
            checked={replaceMode}
            onChange={(e) => setReplaceMode(e.target.checked)}
          />
          Replace items in matching categories (destructive)
        </label>
        <button
          type="button"
          disabled={importing}
          className={cn(buttonVariants({ size: "lg" }), "mt-4")}
          onClick={() => void onImport()}
        >
          {importing ? "Importing…" : "Import CSV"}
        </button>
      </section>

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-3xl border border-[#14110e]/8 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[#14110e]">Categories</h2>
            <div className="mt-3 flex gap-2">
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="New category name"
              />
              <button
                type="button"
                className={cn(buttonVariants())}
                onClick={() => void addCategory()}
              >
                Add
              </button>
            </div>
            <ul className="mt-4 divide-y divide-[#14110e]/8">
              {categories.map((category) => (
                <li key={category.id} className="py-2 text-sm">
                  <span className="font-medium text-[#14110e]">
                    {category.name}
                  </span>
                  {!category.isVisible ? (
                    <span className="ml-2 text-xs text-[#7a7164]">hidden</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-3xl border border-[#14110e]/8 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#14110e]">
                Menu items ({items.length})
              </h2>
              <button
                type="button"
                className={cn(buttonVariants({ size: "sm" }))}
                onClick={() => {
                  setEditing(null);
                  setItemForm({
                    ...emptyItem,
                    categoryId: categories[0]?.id ?? "",
                  });
                  setItemOpen(true);
                }}
                disabled={categories.length === 0}
              >
                Add item
              </button>
            </div>
            <ul className="mt-4 divide-y divide-[#14110e]/8">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium text-[#14110e]">{item.name}</p>
                    <p className="text-xs text-[#7a7164]">
                      {categoryNameById.get(item.categoryId) ?? "—"} ·{" "}
                      {item.price}
                      {!item.isAvailable ? " · unavailable" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                      )}
                      onClick={() => {
                        setEditing(item);
                        setItemForm({
                          categoryId: item.categoryId,
                          name: item.name,
                          description: item.description ?? "",
                          price: item.price,
                          badge: item.badge ?? "",
                          tags: item.tags,
                          isAvailable: item.isAvailable,
                        });
                        setItemOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                      )}
                      onClick={() => void deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={itemForm.categoryId}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input
                value={itemForm.badge}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, badge: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {TAG_OPTIONS.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemForm.tags.includes(tag.id)}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        tags: e.target.checked
                          ? [...prev.tags, tag.id]
                          : prev.tags.filter((t) => t !== tag.id),
                      }))
                    }
                  />
                  {tag.label}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={itemForm.isAvailable}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    isAvailable: e.target.checked,
                  }))
                }
              />
              Available
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              className={cn(buttonVariants())}
              disabled={itemPending}
              onClick={() => void saveItem()}
            >
              {itemPending ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
