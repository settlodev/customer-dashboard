
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect, useState } from "react";

import { Category } from "@/types/category/type";
import { fetchAllCategories } from "@/lib/actions/category-actions";

interface CategoryProps {
    label?: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}
function CategorySelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: CategoryProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadCategories() {
            try {
                setIsLoading(true);
                const fetchedCategories = await fetchAllCategories();
                setCategories(fetchedCategories ?? []);
            } catch (error: any) {
                console.log("Error fetching customers:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadCategories();
    }, []);
    return (
        
        <div className="space-y-2">
        <Select
            defaultValue={value}
            disabled={isDisabled || isLoading}
            value={value}
            onValueChange={onChange}
        >
            <SelectTrigger className="w-full">
                <SelectValue
                    placeholder={placeholder || "Select customer"}
                />
            </SelectTrigger>
            <SelectContent>
                {categories.map((category) => (
                    <SelectItem
                        key={category.id}
                        value={category.id}
                    >
                        {category.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        
    </div>
    )
}
export default CategorySelector
