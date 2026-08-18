"use client";

import React, { useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
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
            <Combobox
                options={brands.map((brand) => ({
                    value: brand.id,
                    label: brand.name,
                    description: brand.slug,
                }))}
                value={value ?? null}
                onChange={(v) => onChange(v ?? "")}
                placeholder={placeholder || "Select brand"}
                searchPlaceholder="Search brands…"
                emptyText={isLoading ? "Loading brands…" : "No brands available"}
                disabled={isDisabled || isLoading}
                ariaLabel="Brand"
            />
            {description && (
                <p className="text-sm text-gray-500">
                    {description}
                </p>
            )}
        </div>
    );
};

export default BrandSelector;
