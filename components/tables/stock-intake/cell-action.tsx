"use client";

import React, { useState } from "react";
import { useDisclosure } from "@nextui-org/modal";
import { EyeIcon } from "@nextui-org/shared-icons";
import { Calculator, EditIcon, Info} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import ItemModal from "../item-modal";
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

interface CellActionProps {
    data: StockIntake & { stockVariant: string };
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    

    // State for edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize React Hook Form
    const form = useForm<z.infer<typeof UpdatedStockIntakeSchema>>({
        resolver: zodResolver(UpdatedStockIntakeSchema),
        defaultValues: {
            value: data.value || 0,
        },
    });

    // Handle edit submission
    const onSubmit = async (values: z.infer<typeof UpdatedStockIntakeSchema>) => {
        setIsSubmitting(true);
        try {
            await updateStockIntake(data.id, { value: values.value });
            setShowEditModal(false);

        } catch (error) {

            console.error("Error updating stock intake:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = () => {
        // Reset form with current data values when opening modal
        form.reset({ value: data.value || 0 });
        // console.log("The data is",data)
        setShowEditModal(true);
    };
    const calculateCostPerItem = () => {
        const newValue = form.watch('value') || 0;
        const quantity = data.quantity || 0;
        return quantity > 0 
          ? (newValue / quantity).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          : '0.00';
      }

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
                    <a
                        style={{ flex: 1 }}
                        onClick={onOpen}
                        className="cursor-pointer"
                    >
                        <EyeIcon color={"#384B70"} />
                    </a>

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
      <DialogContent className="w-full max-w-md mx-auto space-y-4 p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Edit Stock Intake Value
          </DialogTitle>
          
          <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
            <Info className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-700 font-semibold">
              Heads up!
            </AlertTitle>
            <AlertDescription className="text-red-600">
              Modifying this value may affect reports that use this data. 
              Please confirm your changes.
            </AlertDescription>
          </Alert>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Value */}
              <div className="flex flex-col space-y-2">
                <FormLabel className="text-gray-700 font-medium">
                  Current Value
                </FormLabel>
                <Input
                  value={data.value?.toString() || ""}
                  className="w-full"
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
                      New Value
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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

            {/* Cost Calculation Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Calculator className="h-5 w-5" />
                <h4 className="font-semibold text-base">Cost Calculation</h4>
              </div>
              
              <div className="space-y-2 text-blue-600 text-sm">
                <p>
                  <span className="font-medium">Quantity:</span> {data.quantity}
                </p>
                <p>
                  <span className="font-medium">New Value:</span> {' '}
                  {form.watch('value')?.toLocaleString() || 0} TSH
                </p>
                
                <div className="pt-2 mt-2 border-t border-blue-200">
                  <p className="font-bold text-blue-800">
                    Cost Per Item: {calculateCostPerItem()} TSH
                  </p>
                </div>
              </div>
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
                {isSubmitting ? "Updating..." : "Update Value"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
        </>
    );
};