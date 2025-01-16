"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Product } from "@/types/product/type";
import { Variant } from "@/types/variant/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    disabledValues?: string[];
}

const ProductVariantSelector: React.FC<Props> = ({
       placeholder,
       isRequired,
       value,
       isDisabled,
       description,
       onChange,
       disabledValues = [],
   }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getDisplayName = (product: Product, variant: Variant) => {
        return `${product.name} - ${variant.name}`;
    };

    useEffect(() => {
        async function loadProducts() {
            try {
                setIsLoading(true);
                const fetchedProducts = await fectchAllProducts();
                setProducts(fetchedProducts);
            } catch (error: any) {
                console.log("Error fetching products:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProducts();
    }, []);

    const variantOptions = products.flatMap(product =>
        product.variants.map(variant => ({
            id: variant.id,
            displayName: getDisplayName(product, variant),
            disabled: disabledValues.includes(variant.id)
        }))
    );

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
                    <SelectValue placeholder={placeholder || "Select  variant"}/>
                </SelectTrigger>
                <SelectContent>
                    {variantOptions.map((option) => (
                        <SelectItem
                            key={option.id}
                            value={option.id}
                            disabled={option.disabled}
                        >
                            {option.displayName}
                        </SelectItem>
                    ))}
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

export default ProductVariantSelector;
