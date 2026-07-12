"use client";

import React, { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
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
            <Combobox
                options={salaries.map((salary) => ({
                    value: salary.id,
                    label: salary.bankName,
                    description: salary.accountNumber,
                }))}
                value={value ?? null}
                onChange={(v) => onChange(v ?? "")}
                placeholder={placeholder || "Select salary"}
                searchPlaceholder="Search salaries…"
                emptyText={isLoading ? "Loading salaries…" : "No salaries found."}
                disabled={isDisabled || isLoading}
                ariaLabel="Salary"
            />
            {description && (
                <p className="text-sm text-gray-500">
                    {description}
                </p>
            )}
        </div>
    );
};

export default SalarySelector;
