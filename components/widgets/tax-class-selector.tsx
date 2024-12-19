"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
                                               isRequired,
                                               value,
                                               isDisabled,
                                               description,
                                               onChange,
                                           }) => {
    return (
        <div className="space-y-2">
            <Select
                defaultValue={value}
                disabled={isDisabled}
                value={value}
                required={isRequired}
                onValueChange={onChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder || "Select tax class"} />
                </SelectTrigger>
                <SelectContent>
                    {taxClasses.map((taxClass) => (
                        <SelectItem
                            key={taxClass.name}
                            value={taxClass.name}
                        >
                            {taxClass.displayName} ({taxClass.amount}%)
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

export default TaxClassSelector;
