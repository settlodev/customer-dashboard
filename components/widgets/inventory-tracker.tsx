import { Recipe } from "@/types/recipe/type";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import NoItemsMessage from "./no-items-message";
import { useEffect } from "react";

const InventoryTracker = ({
    stockSelected,
    recipeSelected,
    combinedStockOptions,
    recipes,
    variantForm,
    isPending,
    openStockModal,
    openRecipeModal,
    trackInventory,
}: {
    stockSelected: boolean;
    recipeSelected: boolean;
    combinedStockOptions: any[];
    recipes: Recipe[];
    variantForm: any;
    isPending: boolean;
    openStockModal: () => void;
    openRecipeModal: () => void;
    trackInventory: boolean;
}) => {
 const {reset} = variantForm

 useEffect(() => {
    if (!trackInventory) {
        reset({
            name: '', 
        });
    }
}, [trackInventory, reset]);
    return (
    
        <>

            {recipeSelected && (
                <>
                    {recipes && recipes.length > 0 ? (
                        <FormField
                            control={variantForm.control}
                            name="recipe"
                            render={({ field }) => (
                                <FormItem className="flex flex-col mt-2">
                                    <FormLabel>Recipe</FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value || ''}
                                            onValueChange={field.onChange}
                                            disabled={isPending}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select recipe" />
                                            </SelectTrigger>
                                            <SelectContent className="flex-grow overflow-y-auto">
                                                {recipes.map((option) => (
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
                        // Show message to add recipe if no options are available
                        <NoItemsMessage 
                            message="No recipes available" 
                            onClick={openRecipeModal} 
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
                                value={field.value || ''}
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
            // Show message to add stock if no options are available
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



