"use client";

import React from "react";
import { Combobox } from "@/components/ui/combobox";
import {taxClasses} from "@/types/constants";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const TaxClassSelector: React.FC<Props> = ({
                                               placeholder,
                                               value,
                                               isDisabled,
                                               description,
                                               onChange,
                                           }) => {
    return (
        <div className="space-y-2">
            <Combobox
                options={taxClasses.map((taxClass) => ({
                    value: taxClass.name,
                    label: `${taxClass.displayName} (${taxClass.amount}%)`,
                    keywords: [taxClass.description],
                }))}
                value={value ?? null}
                onChange={(v) => onChange(v ?? "")}
                placeholder={placeholder || "Select tax class"}
                searchPlaceholder="Search tax classes…"
                emptyText="No tax classes found."
                disabled={isDisabled}
                ariaLabel="Tax class"
            />

            {description && (
                <p className="text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
};

export default TaxClassSelector;
