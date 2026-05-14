"use client";

import React, { useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Brand } from "@/types/brand/type";
import { useCachedBrands } from "@/lib/cache/reference-data";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    showArchived?: boolean;
}

const BrandSelector: React.FC<Props> = ({
                                            placeholder,
                                            isRequired,
                                            value,
                                            isDisabled,
                                            description,
                                            onChange,
                                            showArchived = false,
                                        }) => {
    const { data: brandsData, loading: isLoading } = useCachedBrands();
    const brands = useMemo<Brand[]>(() => {
        const list = brandsData ?? [];
        return showArchived ? list : list.filter((b) => b.active);
    }, [brandsData, showArchived]);

    return (
        <div className="space-y-2">
            <Select
                defaultValue={value}
                disabled={isDisabled || isLoading}
                value={value}
                required={isRequired}
                onValueChange={onChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue
                        placeholder={placeholder || "Select brand"}
                    />
                </SelectTrigger>
                <SelectContent>
                    {brands.length === 0 ? (
                        <div className="relative py-3 px-2 text-sm text-gray-500 text-center">
                            {isLoading ? "Loading brands..." : "No brands available"}
                        </div>
                    ) : (
                        brands.map((brand) => (
                            <SelectItem
                                key={brand.id}
                                value={brand.id}
                                className="flex items-center justify-between"
                            >
                                <span>{brand.name}</span>
                                <span className="text-sm text-gray-500">
                                    {brand.slug}
                                </span>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            {description && (
                <p className="text-sm text-gray-500">
                    {description}
                </p>
            )}
        </div>
    );
};

export default BrandSelector;
