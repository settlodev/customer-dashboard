// import { StockFormVariant } from "@/types/stockVariant/type";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { SubmitButton } from "./submit-button";
import { MultiSelect } from "../ui/multi-select";

const RecipeFormSection = ({
    recipeForm,
    submitRecipeData,
    onInvalid,
    error,
    success,
    isPending,
    combinedStockOptions,
    selectedVariants,
    remove,
    OnCancel 
}: {
    recipeForm: any;
    submitRecipeData: any;
    onInvalid: any;
    error: string | undefined;
    success: string | undefined;
    isPending: boolean;
    combinedStockOptions: any[];
    selectedVariants: any[];
    remove: () => void;
    OnCancel: () => void
}) => (
    
    <Form {...recipeForm}>
        <form onSubmit={recipeForm.handleSubmit(submitRecipeData, onInvalid)} className="gap-1">
            <FormError message={error} />
            <FormSuccess message={success} />

            <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100 flex">
                <h3 className="font-bold flex-1">Add recipe to track inventory</h3>
                <span className="flex-end">
                    <ChevronDownIcon />
                </span>
            </div>

            <div className="mt-4 flex">
                <div className="flex-1">
                    <FormField
                        control={recipeForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Recipe Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter recipe name"
                                        {...field}
                                        value={field.value}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                  {/* Input for stock variants */}
            <FormField
                control={recipeForm.control}
                name="stockVariants"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock Variant</FormLabel>
                        <FormControl>
                            <MultiSelect
                                options={combinedStockOptions.map((option) => ({
                                    label: option.displayName,
                                    value: option.id,
                                }))}
                                onValueChange={(selectedValues) => {
                                    const updatedVariants = selectedValues.map((value) => {
                                        const stockVariant = combinedStockOptions.find((option) => option.id === value);
                                        return {
                                            id: value,
                                            displayName: stockVariant ? stockVariant.displayName : "",
                                            quantity: 0,
                                        };
                                    });
                                    remove();
                                    recipeForm.setValue("stockVariants", updatedVariants);
                                    // Append updated variants if needed
                                }}
                                {...field}
                                placeholder="Select variant"
                                className="z-[9999] relative"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex flex-col">
                {selectedVariants.map((variant, index) => (
                    <FormField
                        key={variant.id}
                        control={recipeForm.control}
                        name={`stockVariants.${index}.quantity`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Enter quantity"
                                        {...field}
                                        value={field.value || variant.quantity}
                                        onChange={(e) => {
                                            const newValue = parseFloat(e.target.value);
                                            field.onChange(newValue);
                                        }}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
            </div>

            {/* Actions section for saving or canceling */}
            <div className="flex items-center space-x-4 mt-4 border-t border-t-gray-200 pt-5">
                <Button variant="default" onClick={() => {
                    OnCancel()
                    recipeForm.reset();
                    }}>
                    Cancel
                </Button>
                <Separator orientation="vertical" />
                <SubmitButton isPending={isPending} label="Add Recipe" />
            </div>
        </form>
    </Form>
);

export default RecipeFormSection;