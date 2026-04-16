import type { ConsumptionRule } from "@/types/consumption-rule/type";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import NoItemsMessage from "./no-items-message";
import { useEffect } from "react";

const InventoryTracker = ({
    stockSelected,
    consumptionRuleSelected,
    combinedStockOptions,
    consumptionRules,
    variantForm,
    isPending,
    openStockModal,
    openConsumptionRuleModal,
    trackInventory,
}: {
    stockSelected: boolean;
    consumptionRuleSelected: boolean;
    combinedStockOptions: any[];
    consumptionRules: ConsumptionRule[];
    variantForm: any;
    isPending: boolean;
    openStockModal: () => void;
    openConsumptionRuleModal: () => void;
    trackInventory: boolean;
}) => {
  const { reset } = variantForm;

  useEffect(() => {
    if (!trackInventory) {
      reset({ name: "" });
    }
  }, [trackInventory, reset]);

  return (
    <>
      {consumptionRuleSelected && (
        <>
          {consumptionRules && consumptionRules.length > 0 ? (
            <FormField
              control={variantForm.control}
              name="consumptionRuleId"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel>Consumption Rule</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select consumption rule" />
                      </SelectTrigger>
                      <SelectContent className="flex-grow overflow-y-auto">
                        {consumptionRules.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <NoItemsMessage
              message="No consumption rules available"
              onClick={openConsumptionRuleModal}
            />
          )}
        </>
      )}

      {stockSelected && (
        <>
          {combinedStockOptions && combinedStockOptions.length > 0 ? (
            <FormField
              control={variantForm.control}
              name="stockVariant"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel>Stock Item</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock item" />
                      </SelectTrigger>
                      <SelectContent className="flex-grow overflow-y-auto">
                        {combinedStockOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <NoItemsMessage
              message="No stock available. Please add stock."
              onClick={openStockModal}
            />
          )}
        </>
      )}
    </>
  );
};

export default InventoryTracker;
