"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Stock} from "@/types/stock/type";
import { StockVariant } from "@/types/stockVariant/type";
import {fetchStock} from "@/lib/actions/stock-actions";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const StockVariantSelector: React.FC<Props> = ({
       placeholder,
       isRequired,
       value,
       isDisabled,
       description,
       onChange,
   }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getDisplayName = (stock: Stock, variant: StockVariant) => {
        return `${stock.name} - ${variant.name}`;
    };

    useEffect(() => {
        async function loadStocks() {
            try {
                setIsLoading(true);
                const fetchedStocks = await fetchStock();
                setStocks(fetchedStocks);
            } catch (error: any) {
                console.log("Error fetching stocks:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStocks();
    }, []);

    const variantOptions = stocks.flatMap(stock =>
        stock.stockVariants.map(variant => ({
            id: variant.id,
            displayName: getDisplayName(stock, variant)
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
                    <SelectValue placeholder={placeholder || "Select stock variant"} />
                </SelectTrigger>
                <SelectContent>
                    {variantOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.displayName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {description && (
                <p className="text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
};

export default StockVariantSelector;
