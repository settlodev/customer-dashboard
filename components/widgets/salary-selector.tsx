"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Salary} from "@/types/salary/type";
import {fectchSalaries} from "@/lib/actions/salary-actions";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const SalarySelector: React.FC<Props> = ({
                                                 placeholder,
                                                 isRequired,
                                                 value,
                                                 isDisabled,
                                                 description,
                                                 onChange,
                                             }) => {
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadSalaries() {
            try {
                setIsLoading(true);
                const fetchedSalaries = await fectchSalaries();
                setSalaries(fetchedSalaries);
            } catch (error: any) {
                console.log("Error fetching salaries:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSalaries();
    }, []);

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
                        placeholder={placeholder || "Select salary"}
                    />
                </SelectTrigger>
                <SelectContent>
                    {salaries.map((salary) => (
                        <SelectItem
                            key={salary.id}
                            value={salary.id}
                        >
                            {salary.bankName}
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

export default SalarySelector;
