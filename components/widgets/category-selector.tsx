"use client"

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
import { usePathname } from 'next/navigation';
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { Card, CardContent } from "../ui/card";
import ProductCategorySelector from "@/components/widgets/product-category-selector";

interface CategorySelectorProps {
    placeholder: string;
    value?: string;
    isDisabled?: boolean;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

const CategorySelector = ({
    placeholder,
    value,
    isDisabled,
    onChange,
    onBlur
}: CategorySelectorProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [parentCategory, setParentCategory] = useState("");
    const [, setStatus] = useState("true");
    const [imageUrl, setImageUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>("");
    const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
    const pathname = usePathname();

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const fetchedCategories = await fetchAllCategories();
            setCategories(fetchedCategories ?? []);
        } catch (error: any) {
            setError(error.message ?? "Failed to fetch categories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const resetForm = () => {
        setNewCategoryName("");
        setParentCategory("");
        setStatus("true");
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
                    status: true,
                    image: imageUrl,
                    parentCategory: parentCategory
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
        } catch (error: any) {
            console.error("Error creating category:", error);
            setError(error.message ?? "Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectChange = (newValue: string) => {
        setSelectedValue(newValue);
        onChange(newValue);
    };

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
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) resetForm();
            }}>
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
                <DialogContent className="max-w-2xl">
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
                                            <div className="space-y-2">
                                                <Label>Parent Category</Label>
                                                <ProductCategorySelector
                                                    onBlur={() => { }}
                                                    onChange={setParentCategory}
                                                    isDisabled={isSubmitting}
                                                    label="Category"
                                                    placeholder="Select parent category"
                                                    categories={categories}
                                                    value={parentCategory}
                                                />
                                            </div>
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
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newCategoryName.trim()}
                            >
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
