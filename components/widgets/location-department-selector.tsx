"use client";

import React, { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Department } from "@/types/department/type";
import { getCachedDepartments } from "@/lib/cache/reference-data";

interface LocationDepartmentSelectorProps {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  locationId?: string;
  onChange: (value: string) => void;
}

const LocationDepartmentSelector: React.FC<LocationDepartmentSelectorProps> = ({
  placeholder,
  value,
  isDisabled,
  description,
  locationId,
  onChange,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!locationId);

  useEffect(() => {
    if (!locationId) {
      setDepartments([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getCachedDepartments()
      .then((list) => {
        if (!cancelled) setDepartments(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-2">
        <Combobox
          options={departments.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
          value={value ?? null}
          onChange={(v) => onChange(v ?? "")}
          placeholder={
            !locationId
              ? "Select location first"
              : placeholder || "Select department"
          }
          searchPlaceholder="Search departments…"
          emptyText={
            isLoading
              ? "Loading departments…"
              : !locationId
                ? "Please select a location first"
                : "No departments found for this location"
          }
          disabled={isDisabled || isLoading || !locationId}
          ariaLabel="Department"
        />
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {!locationId && (
          <p className="text-sm text-yellow-600">
            Please select a location to view departments
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationDepartmentSelector;
