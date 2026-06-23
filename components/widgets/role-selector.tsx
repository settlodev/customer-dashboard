"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, RoleScope } from "@/types/roles/type";
import { fetchRolesByScope, fetchRolesForCurrentDestination } from "@/lib/actions/role-actions";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  description?: string;
  multiple?: boolean;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  /**
   * Restrict the offered roles to a specific scope target. When both are given,
   * only that destination's roles are shown; otherwise the selector falls back
   * to the active workspace destination. Either way it never lists roles from
   * another location/store/warehouse.
   */
  scope?: RoleScope;
  scopeId?: string;
}

const RoleSelector: React.FC<Props> = ({
  placeholder,
  isRequired,
  value,
  isDisabled,
  description,
  onChange,
  multiple = false,
  scope,
  scopeId,
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        setIsLoading(true);
        const fetched =
          scope && scopeId
            ? await fetchRolesByScope(scope, scopeId)
            : await fetchRolesForCurrentDestination();
        setRoles(fetched);
      } catch {
        // Failed to load roles
      } finally {
        setIsLoading(false);
      }
    }
    loadRoles();
  }, [scope, scopeId]);

  if (multiple) {
    const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

    const toggleRole = (roleId: string) => {
      if (selectedIds.includes(roleId)) {
        onChange(selectedIds.filter((id) => id !== roleId));
      } else {
        onChange([...selectedIds, roleId]);
      }
    };

    const removeRole = (roleId: string) => {
      onChange(selectedIds.filter((id) => id !== roleId));
    };

    return (
      <div className="space-y-2">
        {/* Selected roles */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const role = roles.find((r) => r.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                  {role?.name || id}
                  <button type="button" onClick={() => removeRole(id)} className="ml-0.5 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Dropdown to add */}
        <Select
          disabled={isDisabled || isLoading}
          onValueChange={(val) => toggleRole(val)}
          value=""
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Add role"} />
          </SelectTrigger>
          <SelectContent>
            {roles
              .filter((r) => !selectedIds.includes(r.id))
              .map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                  {role.system && <span className="text-xs text-muted-foreground ml-1">(system)</span>}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    );
  }

  // Single-select mode
  return (
    <div className="space-y-2">
      <Select
        defaultValue={typeof value === "string" ? value : undefined}
        disabled={isDisabled || isLoading}
        value={typeof value === "string" ? value : undefined}
        required={isRequired}
        onValueChange={(val) => onChange(val)}
      >
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
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

export default RoleSelector;
