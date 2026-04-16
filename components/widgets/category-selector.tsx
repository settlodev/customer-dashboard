"use client";

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Category } from "@/types/category/type";
import { fetchAllCategories, createCategory } from "@/lib/actions/category-actions";
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
  const [selfCategories, setSelfCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!simple);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const pathname = usePathname();

  // In simple mode, use external categories. Otherwise, self-fetch.
  const categories = simple ? (externalCategories ?? []) : selfCategories;

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const fetched = await fetchAllCategories();
      setSelfCategories(fetched ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!simple) {
      loadCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple]);

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

    try {
      const response = await createCategory(
        {
          name: newCategoryName,
          active: true,
          imageUrl: imageUrl,
          parentId: parentCategory || undefined,
        },
        pathname,
      );

      if (response.responseType === "success" && response.data) {
        await loadCategories();
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

  const renderCategoryOptions = () => {
    const options: React.ReactNode[] = [];

    categories.forEach((category) => {
      options.push(
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>,
      );

      if (showChildren && category.children && category.children.length > 0) {
        category.children.forEach((child) => {
          options.push(
            <SelectItem key={child.id} value={child.id}>
              <span className="ml-4">&nbsp;&nbsp;└ {child.name}</span>
            </SelectItem>,
          );
        });
      }
    });

    return options;
  };

  const getDisplayName = (selectedId: string) => {
    for (const category of categories) {
      if (category.id === selectedId) return category.name;
      if (category.children) {
        const child = category.children.find((c) => c.id === selectedId);
        if (child) return `${category.name} > ${child.name}`;
      }
    }
    return "";
  };

  // ── Simple mode: just the select, no create button ──────────────
  if (simple) {
    return (
      <Select value={selectedValue} onValueChange={handleSelectChange} disabled={isDisabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedValue ? getDisplayName(selectedValue) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>{renderCategoryOptions()}</SelectContent>
      </Select>
    );
  }

  // ── Full mode: select + inline create ───────────────────────────
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <Select
          value={selectedValue}
          disabled={isDisabled || isLoading}
          onValueChange={handleSelectChange}
          onOpenChange={onBlur}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder}>
              {selectedValue ? getDisplayName(selectedValue) : placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>{renderCategoryOptions()}</SelectContent>
        </Select>
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
