"use client";

import { CreditCard, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Expense } from "@/types/expense/type";
import { toast } from "@/hooks/use-toast";
import { deleteExpense, payExpense } from "@/lib/actions/expense-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DateTimePicker from "@/components/widgets/datetimepicker";
import { PayableExpenseSchema } from "@/types/expense/schema";
import { Input } from "@/components/ui/input";
import { useDisclosure } from "@/hooks/use-disclosure";
import DeleteModal from "@/components/tables/delete-modal";

interface CellActionProps {
  data: Expense;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const form = useForm<z.infer<typeof PayableExpenseSchema>>({
    resolver: zodResolver(PayableExpenseSchema),
    defaultValues: {
      amount: undefined,
      paymentDate: new Date(),
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isValid },
  } = form;
  const watchedAmount = watch("amount");

  useEffect(() => {
    const handlePaymentDialog = (event: CustomEvent) => {
      if (event.detail.purchase.id === data.id) {
        setIsPaymentDialogOpen(true);
      }
    };

    window.addEventListener(
      "openPaymentDialog",
      handlePaymentDialog as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openPaymentDialog",
        handlePaymentDialog as EventListener,
      );
    };
  }, [data.id]);

  useEffect(() => {
    if (isPaymentDialogOpen) {
      reset({
        amount: undefined,
        paymentDate: new Date(),
      });
    }
  }, [isPaymentDialogOpen, reset]);

  const handleTimeChange = (
    type: "hour" | "minutes",
    value: string,
    currentDate: Date,
  ) => {
    const newDate = new Date(currentDate);
    if (type === "hour") newDate.setHours(Number(value));
    else if (type === "minutes") newDate.setMinutes(Number(value));
    return newDate;
  };

  const onSubmit = async (formData: z.infer<typeof PayableExpenseSchema>) => {
    const { amount, paymentDate } = formData;

    if (amount > data.unpaidAmount) {
      toast({
        title: "Amount Too High",
        description: "Payment amount cannot exceed the unpaid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await payExpense(
        data.id,
        amount,
        paymentDate.toISOString(),
      );

      if (response) {
        setIsPaymentDialogOpen(false);
        reset();
        toast({
          title: "Payment Successful",
          description: `Payment of ${Intl.NumberFormat().format(amount)} processed successfully`,
          variant: "success",
        });
        router.refresh();
      }
    } catch (error) {
      console.log("Error:", error);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDelete = async () => {
    try {
      await deleteExpense(data.id);
      toast({
        title: "Deleted",
        description: `${data.name} has been deleted successfully.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          (error as Error).message ||
          "There was an issue with your request, please try again later",
      });
    } finally {
      onOpenChange();
    }
  };

  const resetPaymentForm = () => {
    setIsPaymentDialogOpen(false);
    reset();
  };

  const getRemainingAmount = () => {
    if (!watchedAmount || isNaN(watchedAmount)) return data.unpaidAmount;
    return data.unpaidAmount - watchedAmount;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Payment Button */}
        {(data.paymentStatus === "NOT_PAID" ||
          data.paymentStatus === "PARTIAL") && (
          <Button
            size="sm"
            className="bg-[#EB7F44] text-white shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={() => setIsPaymentDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay
          </Button>
        )}

        {/* Actions Dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0 hover:bg-gray-100" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-medium text-gray-500">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/expenses/${data.id}`)}
              className="cursor-pointer hover:bg-blue-50"
            >
              <Edit className="mr-2 h-4 w-4 text-blue-600" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onOpen}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Archive</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isOpen}
        itemName={data.name}
        onDelete={onDelete}
        onOpenChange={onOpenChange}
      />

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5 text-[#EB7F44]" />
              Process Payment
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter the payment details for{" "}
              <span className="font-semibold text-gray-800">{data.name}</span>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              {/* Outstanding Amount */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Outstanding Amount:
                  </Label>
                  <div className="text-lg font-bold text-gray-900">
                    {Intl.NumberFormat().format(data.unpaidAmount)}
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <FormField
                control={control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Payment Amount *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={data.unpaidAmount}
                        placeholder="0.00"
                        className="pl-10 text-right font-mono text-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    {watchedAmount &&
                      !isNaN(watchedAmount) &&
                      watchedAmount > 0 && (
                        <p className="text-xs text-gray-500">
                          Remaining after payment:{" "}
                          {Intl.NumberFormat().format(getRemainingAmount())}
                        </p>
                      )}
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Payment Date & Time *
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        field={{
                          ...field,
                          value:
                            field.value?.toISOString() ||
                            new Date().toISOString(),
                          onChange: (value: string) =>
                            field.onChange(new Date(value)),
                        }}
                        date={field.value}
                        setDate={field.onChange}
                        handleTimeChange={(type, value) => {
                          const newDate = handleTimeChange(
                            type,
                            value,
                            field.value || new Date(),
                          );
                          field.onChange(newDate);
                        }}
                        onDateSelect={field.onChange}
                        maxDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetPaymentForm}
                  disabled={isProcessing}
                  className="flex-1 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isProcessing ||
                    !isValid ||
                    !watchedAmount ||
                    watchedAmount <= 0
                  }
                  className="flex-1 bg-[#EB7F44] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay{" "}
                      {watchedAmount
                        ? Number(watchedAmount).toFixed(2)
                        : "0.00"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
