"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Brand } from "@/types/brand/type";
import { fectchAllBrands } from "@/lib/actions/brand-actions";

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
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadBrands() {
            try {
                setIsLoading(true);
                const fetchedBrands = await fectchAllBrands();

                const filteredBrands = showArchived
                    ? fetchedBrands
                    : fetchedBrands.filter((brand: Brand) => !brand.isArchived);
                setBrands(filteredBrands);
            } catch (error: any) {
                console.log("Error fetching brands:", error);
                setBrands([]);
            } finally {
                setIsLoading(false);
            }
        }
        loadBrands();
    }, [showArchived]);

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
                                    {brand.location}
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
