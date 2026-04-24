import React, { useEffect, useState } from "react";
import StockVariantSelector from "./stock-variant-selector";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";

interface TrackingOptionsProps {
  onSelectionChange: (selection: {
    itemType: string;
    quantity: number;
    itemId: string | null;
  }) => void;
  initialItemType?: string | null;
  initialItemId?: string | null;
}

/**
 * Stock-variant tracker for product variants. The legacy "consumption rule"
 * option was removed when BOM rules shifted to auto-resolution at deduction
 * time — you no longer attach a rule to a variant; the Inventory Service
 * looks it up from (business, location, product_variant).
 */
const TrackingOptions: React.FC<TrackingOptionsProps> = ({
  onSelectionChange,
  initialItemType,
  initialItemId,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId || null);
  const [quantity] = useState<number>(1);

  useEffect(() => {
    if (initialItemType && initialItemId) {
      setSelectedItemId(initialItemId);
      onSelectionChange({
        itemType: initialItemType || "stock",
        itemId: initialItemId,
        quantity,
      });
    }
  }, [initialItemType, initialItemId, onSelectionChange, quantity]);

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    onSelectionChange({ itemType: "stock", quantity, itemId });
  };

  return (
    <div className="space-y-4">
      <FormField
        name="stock"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <StockVariantSelector
                value={field.value || selectedItemId || ""}
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
  );
};

export default TrackingOptions;
