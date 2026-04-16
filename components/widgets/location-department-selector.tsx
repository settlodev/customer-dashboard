"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department } from "@/types/department/type";
import {
  fetchAllDepartments,
} from "@/lib/actions/department-actions";

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
  isRequired,
  value,
  isDisabled,
  description,
  locationId,
  onChange,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadDepartments = async () => {
    if (!locationId) {
      setDepartments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const fetchedDepartments = await fetchAllDepartments();
      setDepartments(fetchedDepartments ?? []);
    } catch (error: any) {
      console.log("Error fetching departments:", error);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [locationId]); // Reload when locationId changes

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-2">
        <Select
          defaultValue={value}
          disabled={isDisabled || isLoading || !locationId}
          value={value}
          required={isRequired}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !locationId
                  ? "Select location first"
                  : placeholder || "Select department"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {departments.length === 0 ? (
              <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                {!locationId
                  ? "Please select a location first"
                  : "No departments found for this location"}
              </div>
            ) : (
              departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
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
