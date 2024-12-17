import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Adjust to match your UI library
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import RecipeSelector from "./recipe-selector";
import CustomerSelector from "./customer-selector";
import DepartmentSelector from "./department-selector";
import CategorySelector from "./category-selector";

interface OptionsProps {
  onSelectionChange: (selection: {
    itemType: string;
    itemId: string | null;
  }) => void;
}

const DiscountApplyOptionsWidget: React.FC<OptionsProps> = ({ onSelectionChange}) => {
  const [applyOption, setApplyOption] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleTrackingTypeChange = (type: string | null) => {
    setApplyOption(type);
    setSelectedItemId(null);
    onSelectionChange({ itemType: type!, itemId: null });
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    onSelectionChange({ itemType: applyOption!, itemId });
  };


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Apply discount on (optional)</label>
        <Select onValueChange={handleTrackingTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select discount apply option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="variant">Product Item</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="department">Department</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {applyOption === "variant" && (
        <div>
          <FormField
            name="variant"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RecipeSelector
                    value={field.value || selectedItemId}
                    onChange={(id) => {
                      field.onChange(id);
                      handleItemChange(id);
                    }}
                    placeholder="Select recipe"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {applyOption === "customer" && (
        <div>
          <FormField
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CustomerSelector
                    value={field.value || selectedItemId}
                    onChange={(id) => {
                      field.onChange(id);
                      handleItemChange(id);
                    }}
                    placeholder="Select customer"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      {applyOption === "category" && (
        <div>
          <FormField
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CategorySelector
                    value={field.value || selectedItemId}
                    onChange={(id) => {
                      field.onChange(id);
                      handleItemChange(id);
                    }}
                    placeholder="Select category"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}


      {applyOption === "department" && (
        <div>
          <FormField
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DepartmentSelector
                    value={field.value || selectedItemId}
                    onChange={(id) => {
                      field.onChange(id);
                      handleItemChange(id);
                    }}
                    placeholder="Select department"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default DiscountApplyOptionsWidget;
