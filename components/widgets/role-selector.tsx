"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Role} from "@/types/roles/type";
import {fetchAllRoles} from "@/lib/actions/role-actions";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const RoleSelector: React.FC<Props> = ({
      placeholder,
      isRequired,
      value,
      isDisabled,
      description,
      onChange,
  }) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadRoles() {
            try {
                setIsLoading(true);
                const fetchedRoles = await fetchAllRoles();
                setRoles(fetchedRoles);
            } catch (error: any) {
                console.log("Error fetching roles:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadRoles();
    }, []);

    return (
        <div className="space-y-2">

            <Select
                defaultValue={value}
                disabled={isDisabled || isLoading}
                value={value}
                required={isRequired}
                onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder || "Select role"} />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                            {role.name}
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

export default RoleSelector;
