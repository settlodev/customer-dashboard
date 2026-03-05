"use client";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  digitalReceiptPaymentDetails,
  physicalReceiptPaymentDetails,
} from "@/lib/actions/settings-actions";
import PaymentMethodSelectorWidget from "@/components/widgets/paymentMethodSelector";
import {
  physicalReceiptPaymentDetailsSchema,
  PhysicalReceiptPaymentDetails,
} from "@/types/payments/schema";

const formSchema = z.object({
  bankRows: physicalReceiptPaymentDetailsSchema.optional().default([]),
  mnoRows: physicalReceiptPaymentDetailsSchema.optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;
type PaymentRow = PhysicalReceiptPaymentDetails[number];

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  receiptType: "physical" | "digital";
  initialRows?: PaymentRow[];
}

const emptyRow = (): PaymentRow => ({
  acceptedPaymentMethodType: "",
  accountNumber: "",
  notes: "",
});

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  receiptType,
  initialRows,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankRows: initialRows ?? [],
      mnoRows: initialRows ?? [],
    },
  });

  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank,
  } = useFieldArray({ control: form.control, name: "bankRows" });

  const {
    fields: mnoFields,
    append: appendMno,
    remove: removeMno,
  } = useFieldArray({ control: form.control, name: "mnoRows" });

  const onSubmit = async (data: FormValues) => {
    // Merge both tabs, strip incomplete rows, then validate against real schema
    const merged: PhysicalReceiptPaymentDetails = [
      ...(data.bankRows ?? []),
      ...(data.mnoRows ?? []),
    ].filter((r) => r.acceptedPaymentMethodType && r.accountNumber.trim());

    const result = physicalReceiptPaymentDetailsSchema.safeParse(merged);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description:
          result.error.issues[0]?.message ?? "Invalid payment details.",
      });
      return;
    }

    try {
      const saveFn =
        receiptType === "physical"
          ? physicalReceiptPaymentDetails
          : digitalReceiptPaymentDetails;
      await saveFn(result.data);
      toast({
        title: "Saved",
        description: "Payment details saved successfully.",
      });
      onSaved?.();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          error?.message ?? "Something went wrong. Please try again.",
      });
    }
  };

  const renderRows = (
    fields: typeof bankFields | typeof mnoFields,
    mode: "bank" | "mno",
    remove: (index: number) => void,
    append: (row: PaymentRow) => void,
    label: string,
  ) => {
    const fieldName = (mode === "bank" ? "bankRows" : "mnoRows") as
      | "bankRows"
      | "mnoRows";

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Add {mode === "bank" ? "bank account" : "mobile money operator"}{" "}
            information
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyRow())}
            disabled={form.formState.isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {mode === "bank" ? "Bank" : "MNO"}
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {label.toLowerCase()} details added. Click &quot;Add{" "}
            {mode === "bank" ? "Bank" : "MNO"}&quot; to add one.
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">
                  {label} {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => remove(index)}
                  disabled={form.formState.isSubmitting}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid gap-3">
                {/* Payment method selector */}
                <FormField
                  control={form.control}
                  name={`${fieldName}.${index}.acceptedPaymentMethodType`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>
                        {mode === "bank" ? "Bank" : "Mobile Money Operator"}
                      </FormLabel>
                      <FormControl>
                        <PaymentMethodSelectorWidget
                          mode={mode}
                          value={f.value}
                          onChange={f.onChange}
                          isDisabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Account / phone number */}
                <FormField
                  control={form.control}
                  name={`${fieldName}.${index}.accountNumber`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>
                        {mode === "bank" ? "Account Number" : "Phone Number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            mode === "bank"
                              ? "e.g., 0152 xxx xxx xxx x"
                              : "e.g., 5XX XXX XX"
                          }
                          {...f}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name={`${fieldName}.${index}.notes`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Primary business account"
                          {...f}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payment Details for{" "}
            {receiptType === "physical" ? "Physical" : "Digital"} Receipt
          </DialogTitle>
          <DialogDescription>
            Add bank account and mobile money operator (MNO) details to display
            on receipts
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="bank" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bank">Bank Details</TabsTrigger>
                <TabsTrigger value="mno">MNO Details</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4 mt-4">
                {renderRows(
                  bankFields,
                  "bank",
                  removeBank,
                  appendBank,
                  "Bank Account",
                )}
              </TabsContent>

              <TabsContent value="mno" className="space-y-4 mt-4">
                {renderRows(
                  mnoFields,
                  "mno",
                  removeMno,
                  appendMno,
                  "MNO Account",
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Payment Details"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
