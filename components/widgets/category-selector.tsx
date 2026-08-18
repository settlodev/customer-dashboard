"use client";

import React, { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Category } from "@/types/category/type";
import { createCategory } from "@/lib/actions/category-actions";
import { fetchDepartmentsForCurrentLocation } from "@/lib/actions/department-actions";
import {
  invalidateCategoriesCache,
  useCachedCategories,
} from "@/lib/cache/reference-data";
import type { Department } from "@/types/department/type";
import { FormError } from "@/components/widgets/form-error";
import { usePathname } from "next/navigation";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { Card, CardContent } from "../ui/card";

interface CategorySelectorProps {
  placeholder: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  showChildren?: boolean;
  /**
   * When true, the component is a simple controlled select:
   * - receives categories via the `categories` prop
   * - no self-fetching
   * - no inline create button
   */
  simple?: boolean;
  /** Categories to render (only used when simple=true) */
  categories?: Category[] | null;
}

const CategorySelector = ({
  placeholder,
  value,
  isDisabled,
  onChange,
  onBlur,
  showChildren = true,
  simple = false,
  categories: externalCategories,
}: CategorySelectorProps) => {
  const { data: cachedCategoriesData, loading: cachedLoading } = useCachedCategories();
  const selfCategories: Category[] = cachedCategoriesData ?? [];
  const isLoading = simple ? false : cachedLoading;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  // Resolved at mount; the inline create modal needs a departmentId to
  // submit since department is mandatory on categories. We pick the
  // location's default (or the only available department) — locations
  // with multiple departments need to use the full category form.
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string | null>(null);
  const pathname = usePathname();

  // In simple mode, use external categories. Otherwise, self-fetch.
  const categories = simple ? (externalCategories ?? []) : selfCategories;

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    fetchDepartmentsForCurrentLocation(true)
      .then((depts: Department[]) => {
        if (cancelled) return;
        const preferred =
          depts.find((d) => d.isDefault) ?? (depts.length === 1 ? depts[0] : null);
        setDefaultDepartmentId(preferred ? preferred.id : null);
      })
      .catch(() => setDefaultDepartmentId(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setNewCategoryName("");
    setParentCategory("");
    setImageUrl("");
    setError("");
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError("");
    setIsSubmitting(true);

    if (!defaultDepartmentId) {
      setError(
        "This location has multiple departments — please use the full category form to choose one.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await createCategory(
        {
          name: newCategoryName,
          active: true,
          imageUrl: imageUrl,
          parentId: parentCategory || undefined,
          departmentId: defaultDepartmentId,
        },
        pathname,
      );

      if (response.responseType === "success" && response.data) {
        invalidateCategoriesCache();
        const newCategoryId = response.data.id;
        setSelectedValue(newCategoryId);
        onChange(newCategoryId);
        resetForm();
        setIsModalOpen(false);
      } else {
        setError(response.message ?? "Failed to create category");
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };

  const categoryOptions = categories.flatMap((category) => {
    const entries = [{ value: category.id, label: category.name }];
    if (showChildren && category.children && category.children.length > 0) {
      category.children.forEach((child) => {
        entries.push({ value: child.id, label: `${category.name} > ${child.name}` });
      });
    }
    return entries;
  });

  // ── Simple mode: just the combobox, no create button ────────────
  if (simple) {
    return (
      <Combobox
        options={categoryOptions}
        value={selectedValue ?? null}
        onChange={(v) => handleSelectChange(v ?? "")}
        placeholder={placeholder}
        searchPlaceholder="Search categories…"
        emptyText="No categories found."
        disabled={isDisabled}
        ariaLabel="Category"
        onOpenChange={(open) => {
          if (!open) onBlur?.();
        }}
      />
    );
  }

  // ── Full mode: select + inline create ───────────────────────────
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <Combobox
          options={categoryOptions}
          value={selectedValue ?? null}
          onChange={(v) => handleSelectChange(v ?? "")}
          placeholder={placeholder}
          searchPlaceholder="Search categories…"
          emptyText={isLoading ? "Loading categories…" : "No categories found."}
          disabled={isDisabled || isLoading}
          ariaLabel="Category"
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
          if (!open) resetForm();
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
        <DialogContent className="max-w-[350px] lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-6">
            <FormError message={error} />

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-6 items-start">
                  <div className="space-y-4">
                    <Label>Category Image</Label>
                    <div className="bg-gray-50 rounded-lg p-4 content-center">
                      <UploadImageWidget
                        imagePath="categories"
                        displayStyle="default"
                        displayImage={true}
                        showLabel={false}
                        label="Image"
                        setImage={setImageUrl}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="categoryName"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Category</Label>
                      <CategorySelector
                        simple
                        categories={categories}
                        onChange={setParentCategory}
                        placeholder="Select parent category"
                        isDisabled={isSubmitting}
                        value={parentCategory}
                        showChildren={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newCategoryName.trim()}>
                {isSubmitting ? "Processing..." : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategorySelector;
