"use client"

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchUnits } from "@/lib/actions/unit-actions";
import { Units } from "@/types/unit/type";

interface UnitSelectorProps {
    placeholder: string;
    value?: string;
    isDisabled?: boolean;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

const UnitSelector = ({
                          placeholder,
                          value,
                          isDisabled,
                          onChange,
                          onBlur
                      }: UnitSelectorProps) => {
    const [units, setUnits] = useState<Units[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUnits = async () => {
            try {
                setIsLoading(true);
                const fetchedUnits = await fetchUnits();
                const sortedUnits = (fetchedUnits ?? []).sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setUnits(sortedUnits);
            } catch (error: any) {
                console.log(error.message ?? "Failed to fetch units");
            } finally {
                setIsLoading(false);
            }
        };
        loadUnits();
    }, []);

    return (
        <Select
            value={value}
            disabled={isDisabled || isLoading}
            onValueChange={onChange}
            onOpenChange={onBlur}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default UnitSelector;
