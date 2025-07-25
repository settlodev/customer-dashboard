"use client";

import React, { useState } from "react";
import { useDisclosure } from "@nextui-org/modal";
// import { EyeIcon } from "@nextui-org/shared-icons";
import { Calculator, EditIcon, Info} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { StockIntake } from "@/types/stock-intake/type";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateStockIntake } from "@/lib/actions/stock-intake-actions";
import { z } from "zod";
import { UpdatedStockIntakeSchema } from "@/types/stock-intake/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ItemModal from "../../item-modal";

interface CellActionProps {
    data: StockIntake & { stockVariant: string };
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    // const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen, onOpenChange } = useDisclosure();

    // State for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize React Hook Form
    const form = useForm<z.infer<typeof UpdatedStockIntakeSchema>>({
        resolver: zodResolver(UpdatedStockIntakeSchema),
        defaultValues: {
            value: data.value || 0,
            quantity: data.quantity || 0
        },
    });

    // Handle edit submission
    const onSubmit = async (values: z.infer<typeof UpdatedStockIntakeSchema>) => {
        setIsSubmitting(true);
        try {
            await updateStockIntake(data.id, { value: values.value, quantity: values.quantity });
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating stock intake:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = () => {
        // Reset form with current data values when opening modal
        form.reset({ 
            value: data.value || 0,
            quantity: data.quantity || 0
        });
        setShowEditModal(true);
    };

    // Improved calculation function that uses new quantity
    const calculateCostPerItem = () => {
        const newValue = form.watch('value') || 0;
        const newQuantity = form.watch('quantity') || 0;
        
        return newQuantity > 0 
            ? (newValue / newQuantity).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
            : '0.00';
    };

    // Calculate the difference in cost per item
    const calculateCostDifference = () => {
        const originalCostPerItem = data.quantity > 0 ? (data.value || 0) / data.quantity : 0;
        const newValue = form.watch('value') || 0;
        const newQuantity = form.watch('quantity') || 0;
        const newCostPerItem = newQuantity > 0 ? newValue / newQuantity : 0;
        
        const difference = newCostPerItem - originalCostPerItem;
        const isIncrease = difference > 0;
        
        return {
            difference: Math.abs(difference).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
            isIncrease,
            hasChange: Math.abs(difference) > 0.01 // Only show if difference is significant
        };
    };

    // Get current form values for display
    const watchedValue = form.watch('value') || 0;
    const watchedQuantity = form.watch('quantity') || 0;

    return (
        <>
            <div style={{ alignItems: "flex-end" }}>
                <div
                    style={{
                        display: "flex",
                        float: "right",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        fontSize: 20,
                    }}
                >
                    {/* <a
                        style={{ flex: 1 }}
                        onClick={onOpen}
                        className="cursor-pointer"
                    >
                        <EyeIcon color={"#384B70"} />
                    </a> */}

                    <a
                        style={{ flex: 1 }}
                        onClick={handleOpenEditModal}
                        className="cursor-pointer"
                    >
                        <EditIcon color={"#384B70"} size={20} />
                    </a>
                </div>
            </div>

            {/* View Modal */}
            <ItemModal isOpen={isOpen} onOpenChange={onOpenChange} data={data} />

            {/* Edit Modal with React Hook Form */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="w-full max-w-lg mx-auto space-y-4 p-6 rounded-lg shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">
                            Edit Stock Intake Value & Quantity
                        </DialogTitle>
                        
                        <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
                            <Info className="h-5 w-5 text-red-500" />
                            <AlertTitle className="text-red-700 font-semibold">
                                Heads up!
                            </AlertTitle>
                            <AlertDescription className="text-red-600">
                                Modifying this value or quantity may affect reports that use this data. 
                                Please confirm your changes.
                            </AlertDescription>
                        </Alert>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Current Quantity */}
                                <div className="flex flex-col space-y-2">
                                    <FormLabel className="text-gray-700 font-medium">
                                        Current Quantity
                                    </FormLabel>
                                    <Input
                                        value={data.quantity?.toString() || ""}
                                        className="w-full bg-gray-50"
                                        disabled
                                    />
                                </div>

                                {/* New Quantity */}
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col space-y-2">
                                            <FormLabel className="text-gray-700 font-medium">
                                                New Quantity
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-sm" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Current Value */}
                                <div className="flex flex-col space-y-2">
                                    <FormLabel className="text-gray-700 font-medium">
                                        Current Value (TSH)
                                    </FormLabel>
                                    <Input
                                        value={data.value?.toString() || ""}
                                        className="w-full bg-gray-50"
                                        disabled
                                    />
                                </div>

                                {/* New Value */}
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col space-y-2">
                                            <FormLabel className="text-gray-700 font-medium">
                                                New Value (TSH)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 text-sm" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Enhanced Cost Calculation Card */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Calculator className="h-5 w-5" />
                                    <h4 className="font-semibold text-base">Cost Calculation</h4>
                                </div>
                                
                                {/* Current vs New Comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Current Calculation */}
                                    <div className="bg-white rounded-md p-3 border border-blue-200">
                                        <h5 className="font-medium text-blue-800 mb-2">Current</h5>
                                        <div className="space-y-1 text-blue-600 text-sm">
                                            <p><span className="font-medium">Quantity:</span> {data.quantity}</p>
                                            <p><span className="font-medium">Total Value:</span> {(data.value || 0).toLocaleString()} TSH</p>
                                            <p className="font-bold text-blue-800 pt-1 border-t border-blue-200">
                                                Cost Per Item: {data.quantity > 0 ? ((data.value || 0) / data.quantity).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }) : '0.00'} TSH
                                            </p>
                                        </div>
                                    </div>

                                    {/* New Calculation */}
                                    <div className="bg-white rounded-md p-3 border border-green-200">
                                        <h5 className="font-medium text-green-800 mb-2">New</h5>
                                        <div className="space-y-1 text-green-600 text-sm">
                                            <p><span className="font-medium">Quantity:</span> {watchedQuantity}</p>
                                            <p><span className="font-medium">Total Value:</span> {watchedValue.toLocaleString()} TSH</p>
                                            <p className="font-bold text-green-800 pt-1 border-t border-green-200">
                                                Cost Per Item: {calculateCostPerItem()} TSH
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Difference Indicator */}
                                {(() => {
                                    const costDiff = calculateCostDifference();
                                    if (costDiff.hasChange) {
                                        return (
                                            <div className={`text-center p-2 rounded-md ${
                                                costDiff.isIncrease 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                <p className="font-medium text-sm">
                                                    Cost per item {costDiff.isIncrease ? 'increased' : 'decreased'} by {costDiff.difference} TSH
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* Action Buttons */}
                            <DialogFooter className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto"
                                    disabled={isSubmitting || !form.formState.isDirty}
                                >
                                    {isSubmitting ? "Updating..." : "Update Values"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};