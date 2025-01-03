import React, { useState} from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Adjust to match your UI library
import StockVariantSelector from "./stock-variant-selector";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import RecipeSelector from "./recipe-selector";

interface TrackingOptionsProps {
  onSelectionChange: (selection: {
    itemType: string;
    quantity: number;
    itemId: string | null;
  }) => void;
  
}

const TrackingOptions: React.FC<TrackingOptionsProps> = ({ onSelectionChange }) => {
  const [trackingType, setTrackingType] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantity] = useState<number>(1);
  // const [isPending] = useTransition();

  const handleTrackingTypeChange = (type: string | null) => {
    setTrackingType(type);
    setSelectedItemId(null);
    onSelectionChange({ itemType: type!, quantity, itemId: null });
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    onSelectionChange({ itemType: trackingType!, quantity, itemId });
  };


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mt-2">Select Tracking Type</label>
        <Select onValueChange={handleTrackingTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose tracking type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recipe">Recipe</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {trackingType === "recipe" && (
        <div>
          <FormField
            name="recipe"
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

{trackingType === "stock" && (
        <div>
          <FormField
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <StockVariantSelector
                    value={field.value || selectedItemId}
                    onChange={(id) => {
                      field.onChange(id);
                      handleItemChange(id);
                    }}
                    placeholder="Select stock variant"
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

export default TrackingOptions;
