"use client";

import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Role, WarehouseRole} from "@/types/roles/type";
import { searchWarehouseRoles } from "@/lib/actions/warehouse/roles-action";

interface Props {
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
}

const WarehouseRoleSelector: React.FC<Props> = ({
      placeholder,
      isRequired,
      value,
      isDisabled,
      description,
      onChange,
  }) => {
    const [roles, setRoles] = useState<WarehouseRole[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const q = "";
    const size = 10;
    const page = 0;

    useEffect(() => {
        async function loadRoles() {
            try {
                setIsLoading(true);
                const fetchedRoles = await searchWarehouseRoles(q, page, size);
                setRoles(fetchedRoles.content);
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

export default WarehouseRoleSelector;
