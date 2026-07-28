
"use client"

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { createCategory } from "@/lib/actions/category-actions";
import { FormError } from "@/components/widgets/form-error";
import { usePathname } from 'next/navigation';
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { Card, CardContent } from "../ui/card";
import { ExpenseCategory } from "@/types/expenseCategories/type";
import { fetchExpenseCategories } from "@/lib/actions/expense-categories-actions";

interface CategorySelectorProps {
    placeholder: string;
    value?: string;
    isDisabled?: boolean;
    onChange: (value: string) => void;
    onBlur?: () => void;
    
}

const ExpenseCategorySelector = ({
    placeholder,
    value,
    isDisabled,
    onChange,
    onBlur,
   
}: CategorySelectorProps) => {
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [, setStatus] = useState("true");
    const [imageUrl, setImageUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>("");
    const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
        []
      );
    const pathname = usePathname();

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

  
        const getExpenseCategories = async () => {
          try {
            setIsLoading(true)
            const response = await fetchExpenseCategories();
            setExpenseCategories(response);
          } catch (error) {
            console.error("Error fetching countries", error);
          }
        };
      
        useEffect(() => {
            getExpenseCategories()
        }, []);

    const resetForm = () => {
        setNewCategoryName("");
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
                    
                },
                pathname,
            );

            if (response.responseType === "success" && response.data) {
                await getExpenseCategories()
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

    // Helper function to render category options with subcategories
    const renderCategoryOptions = () => {
        const options: React.ReactNode[] = [];

        expenseCategories.forEach((category) => {
            // Add the main category
            options.push(
                <SelectItem key={category.id} value={category.id}>
                    {category.name}
                </SelectItem>
            );
        });

        return options;
    };

    // Helper function to get display name for selected value
    const getDisplayName = (selectedId: string) => {
        for (const category of expenseCategories) {
            if (category.id === selectedId) {
                return category.name;
            }
            
        }
        return "";
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
                        <SelectValue placeholder={placeholder}>
                            {selectedValue ? getDisplayName(selectedValue) : placeholder}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {renderCategoryOptions()}
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
                <DialogContent className="max-w-[350px] lg:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-6">
                        <FormError message={error} />

                        <Card className=" ">
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

export default ExpenseCategorySelector;