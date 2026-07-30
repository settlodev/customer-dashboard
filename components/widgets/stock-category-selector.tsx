"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Tag } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/widgets/form-error";
import { createStockCategory } from "@/lib/actions/stock-category-actions";
import {
  invalidateStockCategoriesCache,
  useCachedStockCategories,
} from "@/lib/cache/reference-data";

interface StockCategorySelectorProps {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * Picker for the inventory-side stock taxonomy. Simpler than the product
 * `CategorySelector` by design: stock categories are flat and carry no
 * department, parent, or image, so the inline create form is one field.
 */
const StockCategorySelector = ({
  placeholder = "Select a stock category",
  value,
  isDisabled,
  onChange,
  onBlur,
}: StockCategorySelectorProps) => {
  const { data, loading } = useCachedStockCategories();
  const categories = data ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const pathname = usePathname();

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // Active categories only — `active` gates assignment. The one exception is
  // the currently-selected category: if it has since been deactivated we
  // still include it, or an existing stock item's saved value would render
  // blank and look like data loss.
  const options = useMemo(() => {
    return categories
      .filter((c) => c.active || c.id === selectedValue)
      .map((c) => ({
        value: c.id,
        label: c.active ? c.name : `${c.name} (inactive)`,
      }));
  }, [categories, selectedValue]);

  const handleSelectChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await createStockCategory(
        { name: newName.trim(), active: true },
        pathname,
      );

      if (response.responseType === "success" && response.data) {
        invalidateStockCategoriesCache();
        const newId = response.data.id;
        setSelectedValue(newId);
        onChange(newId);
        setNewName("");
        setIsModalOpen(false);
      } else {
        // The duplicate-name message from the backend is merchant-readable.
        setError(response.message ?? "Failed to create stock category");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to create stock category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <Combobox
          options={options}
          value={selectedValue ?? null}
          onChange={(v) => handleSelectChange(v ?? "")}
          placeholder={placeholder}
          searchPlaceholder="Search stock categories…"
          emptyText={loading ? "Loading…" : "No stock categories found."}
          disabled={isDisabled || loading}
          ariaLabel="Stock Category"
          className="w-full"
          onOpenChange={(open) => {
            if (!open) onBlur?.();
          }}
        />
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setNewName("");
            setError("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isDisabled}
            className="flex-shrink-0"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[350px] lg:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-6">
            <FormError message={error} />
            <div className="space-y-2">
              <Label htmlFor="stockCategoryName">Name</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="stockCategoryName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Beverages"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newName.trim()}>
                {isSubmitting ? "Processing..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockCategorySelector;
