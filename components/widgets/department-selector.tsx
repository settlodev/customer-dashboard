"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Department} from "@/types/department/type";
import {fectchAllDepartments} from "@/lib/actions/department-actions";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const DepartmentSelector: React.FC<Props> = ({
       placeholder,
       isRequired,
       value,
       isDisabled,
       description,
       onChange,
   }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadDepartments() {
            try {
                setIsLoading(true);
                const fetchedDepartments = await fectchAllDepartments();
                setDepartments(fetchedDepartments);
            } catch (error: any) {
                console.log("Error fetching departments:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDepartments();
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
                        placeholder={placeholder || "Select department"}
                    />
                </SelectTrigger>
                <SelectContent>
                    {departments.map((department) => (
                        <SelectItem
                            key={department.id}
                            value={department.id}
                        >
                            {department.name}
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

export default DepartmentSelector;
