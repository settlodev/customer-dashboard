"use client"

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taxClasses } from "@/types/constants";

interface TaxClassSelectorProps {
    placeholder: string;
    value?: string;
    isDisabled?: boolean;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

const TaxClassSelector = ({
                              placeholder,
                              value,
                              isDisabled,
                              onChange,
                              onBlur
                          }: TaxClassSelectorProps) => {
    return (
        <Select
            value={value}
            disabled={isDisabled}
            onValueChange={onChange}
            onOpenChange={onBlur}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {taxClasses.map((taxClass) => (
                    <SelectItem key={taxClass.code} value={taxClass.code.toString()}>
                        {taxClass.displayName} ({taxClass.amount}%)
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default TaxClassSelector;
