import { StockFormVariant } from "@/types/stockVariant/type";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { SubmitButton } from "./submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import UploadImageWidget from "./UploadImageWidget";
import { NumericFormat } from "react-number-format";



const ModalContainer = ({ children}: { children: React.ReactNode }) => (
    <div className="fixed w-[100%] h-[100%] z-50 left-0 top-0 flex items-center justify-center">
        <div className="w-[950px] p-5 bg-white rounded-md">{children}</div>
    </div>
);

const StockFormSection = ({
    stockForm,
    submitStockData,
    onInvalid,
    error,
    success,
    isPending,
    stockVariants,
    removeStockVariant,
    OnCancel 
}: {
    stockForm: any;
    submitStockData: any;
    onInvalid: any;
    error: string | undefined;
    success: string | undefined;
    isPending: boolean;
    stockVariants: StockFormVariant[];
    removeStockVariant: (index: number) => void;
    OnCancel: () => void
}) => (
    <Form {...stockForm}>
        <form onSubmit={stockForm.handleSubmit(submitStockData, onInvalid)} className="gap-1">
            <FormError message={error} />
            <FormSuccess message={success} />

            <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 flex">
                <h3 className="font-bold flex-1">Add stock to track inventory</h3>
                <span className="flex-end">
                    <ChevronDownIcon />
                </span>
            </div>

            <div className="mt-4 flex">
                <div className="flex-1">
                    <FormField
                        control={stockForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter stock name"
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

            <div className="mt-4">
                <FormField
                    control={stockForm.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter stock description"
                                    {...field}
                                    disabled={isPending}
                                    className="resize-none bg-gray-50"
                                    maxLength={200}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 flex mt-4">
                <h3 className="font-bold flex-1">Stock Variants</h3>
                <span className="flex-end">
                    <ChevronDownIcon />
                </span>
            </div>

            {stockVariants.length > 0 ? (
                <div className="border-t-1 border-t-gray-100 p-5">
                    <h3 className="font-bold pb-2">Variants</h3>
                    <div className="border-emerald-500 border-0 rounded-md pt-2 pb-2">
                        {stockVariants.map((variant, index) => (
                            <div
                                className="flex border-1 border-emerald-200 mt-0 items-center mb-1"
                                key={index}
                            >
                                <p className="text-gray-500 pl-4 pr-4 font-bold text-xs border-r-1 h-14 mr-4">
                                    {index + 1}
                                </p>
                                <div className="flex-1 pt-1 pb-1">
                                    <p className="text-md font-medium">{variant.name}</p>
                                    <p className="text-xs font-medium">
                                        VALUE: {variant.startingValue} | QUANTITY: {variant.startingQuantity} | ALERT LEVEL: {variant.alertLevel}
                                    </p>
                                </div>
                                <p
                                    onClick={() => removeStockVariant(index)}
                                    className="text-red-700 pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 cursor-pointer"
                                >
                                    <span>Remove</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <p className="pt-3 pb-5 text-sm">No variants added</p>
                    <p className="text-danger-500 text-sm">Add at least one variant then click save</p>
                </>
            )}

            <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
                <Button variant="default" onClick={() => OnCancel()}>
                    Cancel
                </Button>
                <Separator orientation="vertical" />
                <SubmitButton
                    isPending={isPending || stockVariants.length === 0}
                    label="Add Stock"
                />
            </div>
        </form>
    </Form>
);

const StockVariantFormSection = ({
    stockVariantForm,
    saveStockVariantItem,
    onInvalid,
    error,
    success,
    isPending,
    setVariantImageUrl,
}: {
    stockVariantForm: any;
    saveStockVariantItem: any;
    onInvalid: any;
    error: string | undefined;
    success: string | undefined;
    isPending: boolean;
    setVariantImageUrl: (url: string) => void;
}) => (
    <Form {...stockVariantForm}>
        <form onSubmit={stockVariantForm.handleSubmit(saveStockVariantItem, onInvalid)} className="gap-1">
            <Card>
                <CardHeader>
                    <CardTitle>Add Stock Variants</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormError message={error} />
                    <FormSuccess message={success} />

                    <div className="mt-4 flex">
                        <UploadImageWidget
                            imagePath="products"
                            displayStyle="default"
                            displayImage
                            setImage={setVariantImageUrl}
                        />
                        <div className="flex-1">
                            <FormField
                                control={stockVariantForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variant Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Variant name (e.g., Small)"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={stockVariantForm.control}
                        name="startingQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Starting Quantity</FormLabel>
                                <FormControl>
                                    <NumericFormat
                                        className="w-full border rounded-md py-2 px-3 text-sm"
                                        value={field.value}
                                        disabled={isPending}
                                        placeholder="0.00"
                                        thousandSeparator
                                        allowNegative={false}
                                        onValueChange={(values) => field.onChange(Number(values.value.replace(/,/g, "")))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={stockVariantForm.control}
                        name="startingValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Starting Value (Amount)</FormLabel>
                                <FormControl>
                                    <NumericFormat
                                        className="w-full border rounded-md py-2 px-3 text-sm"
                                        value={field.value}
                                        disabled={isPending}
                                        placeholder="0.00"
                                        thousandSeparator
                                        allowNegative={false}
                                        onValueChange={(values) => field.onChange(Number(values.value.replace(/,/g, "")))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={stockVariantForm.control}
                        name="alertLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alert Level</FormLabel>
                                <FormControl>
                                    <NumericFormat
                                        className="w-full border rounded-md py-2 px-3 text-sm"
                                        value={field.value}
                                        disabled={isPending}
                                        placeholder="0.00"
                                        thousandSeparator
                                        allowNegative={false}
                                        onValueChange={(values) => field.onChange(Number(values.value.replace(/,/g, "")))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Quantity below this level will trigger an alert
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>

                <div className="flex ml-6 mb-6">
                    <SubmitButton
                        isPending={isPending}
                        label="Save Variant"
                        onClick={stockVariantForm.handleSubmit(saveStockVariantItem, onInvalid)}
                    />
                </div>
            </Card>
        </form>
    </Form>
);

export {ModalContainer, StockFormSection, StockVariantFormSection};