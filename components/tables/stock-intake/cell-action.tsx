"use client";

import React, { useState } from "react";
import { useDisclosure } from "@nextui-org/modal";
import { EyeIcon } from "@nextui-org/shared-icons";
import { EditIcon, InfoIcon } from "lucide-react";
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

        } catch (error) {

            console.error("Error updating stock intake:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEditModal = () => {
        // Reset form with current data values when opening modal
        form.reset({ value: data.value || 0 });
        setShowEditModal(true);
    };

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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Stock Intake Value</DialogTitle>
                        <Alert variant="destructive">
                            <InfoIcon className="h-5 w-5 " />
                            <AlertTitle>Heads up!</AlertTitle>
                            <AlertDescription>
                                Modifying this value may affect reports that use this data. Please confirm your changes.
                            </AlertDescription>
                        </Alert>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-4 py-2">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right">Current Value</FormLabel>
                                    <Input
                                        value={data.value?.toString() || ""}
                                        className="col-span-3"
                                        disabled
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4">
                                            <FormLabel className="text-right">New Value</FormLabel>
                                            <div className="col-span-3">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage className="mt-1" />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
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