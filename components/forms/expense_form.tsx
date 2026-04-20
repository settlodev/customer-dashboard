"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { Expense } from "@/types/expense/type";
import { ExpenseSchema } from "@/types/expense/schema";
import { createExpense, updateExpense } from "@/lib/actions/expense-actions";
import { fetchExpenseCategories } from "@/lib/actions/expense-categories-actions";
import { ExpenseCategory } from "@/types/expenseCategories/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import DateTimePicker from "../widgets/datetimepicker";
import { useRouter } from "next/navigation";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";
import {
  CalendarDays,
  Receipt,
  Tags,
  User2,
  DollarSign,
  CreditCard,
  ImageIcon,
  X,
  CheckCircle2,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";

function ExpenseForm({ item }: { item: Expense | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error] = useState<string | undefined>("");
  const [success] = useState<string | undefined>("");
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    [],
  );
  const [date, setDate] = useState<Date | undefined>(
    item?.date ? new Date(item.date) : undefined,
  );
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const getExpenseCategories = async () => {
      try {
        const response = await fetchExpenseCategories();
        setExpenseCategories(response);
      } catch (error) {
        console.error("Error fetching expense categories", error);
      }
    };
    getExpenseCategories();
  }, []);

  const form = useForm<z.infer<typeof ExpenseSchema>>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: item ? item : { status: true },
  });

  const receiptUrl = form.watch("receiptUrl");

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          typeof errors.message === "string"
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof ExpenseSchema>) => {
    startTransition(() => {
      if (item) {
        updateExpense(item.id, values).then((data) => {
          if (data) {
            setResponse(data);
            if (data.responseType === "success") {
              toast({
                variant: "success",
                title: "Success",
                description: data.message,
              });
              router.push("/expenses");
            }
          }
        });
      } else {
        createExpense(values)
          .then((data) => {
            if (data) {
              setResponse(data);
              if (data.responseType === "success") {
                toast({
                  variant: "success",
                  title: "Success",
                  description: data.message,
                });
                router.push("/expenses");
              }
            }
          })
          .catch((err) => console.error(err));
      }
    });
  };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!date) return;
    const newDate = new Date(date);
    if (type === "hour") newDate.setHours(Number(value));
    else if (type === "minutes") newDate.setMinutes(Number(value));
    setDate(newDate);
  };

  const handleDateSelect = (d: Date) => setDate(d);
  const handleClearReceipt = () => form.setValue("receiptUrl", "");

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-6 sm:space-y-8"
        >
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* ── Expense Information ─────────────────────────────────── */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Expense Information
              </CardTitle>
              <CardDescription className="text-sm">
                Enter the basic details about this expense
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Receipt className="h-4 w-4 shrink-0" />
                        Expense Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter expense name"
                          disabled={isPending}
                          className="h-10 sm:h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseCategory"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Tags className="h-4 w-4 shrink-0" />
                        Category
                      </FormLabel>
                      <Select
                        disabled={isPending || expenseCategories.length === 0}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories.map((category, index) => (
                            <SelectItem key={index} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        Expense Date
                      </FormLabel>
                      <DateTimePicker
                        field={field}
                        date={date}
                        setDate={setDate}
                        handleTimeChange={handleTimeChange}
                        onDateSelect={handleDateSelect}
                        maxDate={new Date()}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staff"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User2 className="h-4 w-4 shrink-0" />
                        Processed by
                      </FormLabel>
                      <FormControl>
                        <StaffSelectorWidget
                          {...field}
                          isRequired
                          isDisabled={isPending}
                          placeholder="Select staff member"
                          label="Select staff member"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Payment Information ──────────────────────────────────── */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Payment Information
              </CardTitle>
              <CardDescription className="text-sm">
                Track the total amount and payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        Total Amount
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={field.value ?? ""}
                          onValueChange={(values) =>
                            field.onChange(Number(values.value))
                          }
                          thousandSeparator={true}
                          placeholder="Enter total expense amount"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4 shrink-0" />
                        Paid Amount
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={field.value ?? ""}
                          onValueChange={(values) =>
                            field.onChange(Number(values.value))
                          }
                          thousandSeparator={true}
                          placeholder="Enter paid expense amount"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Receipt Attachment ───────────────────────────────────── */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Receipt Attachment
              </CardTitle>
              <CardDescription className="text-sm">
                Optionally attach a photo or scan of the receipt for this
                expense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="receiptUrl"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    {/*
                      Mobile  → stacked: upload area full-width, info panel below
                      Desktop → side-by-side: fixed-width upload on left, info on right
                    */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      {/* Upload widget */}
                      <FormControl>
                        <UploadImageWidget
                          imagePath="expenses/receipts"
                          image={field.value ?? null}
                          setImage={(url) => field.onChange(url)}
                          label="Click to upload receipt"
                          displayImage={true}
                          displayStyle="default"
                          showLabel={true}
                          className="w-full sm:w-48 sm:shrink-0 h-44 sm:h-48 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                        />
                      </FormControl>

                      {/* Info panel */}
                      <div className="flex flex-col gap-4 sm:pt-1 flex-1 min-w-0">
                        {/* Attachment status */}
                        {receiptUrl ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Receipt attached
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearReceipt}
                              disabled={isPending}
                              className="h-7 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                            <span>No receipt attached yet</span>
                          </div>
                        )}

                        {/* Accepted formats */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Accepted formats
                          </p>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {["JPG", "PNG", "WEBP", "GIF"].map((fmt) => (
                              <span
                                key={fmt}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                              >
                                {fmt}
                              </span>
                            ))}
                            <span className="text-xs text-gray-400">
                              — max 10 MB
                            </span>
                          </div>
                        </div>

                        {/* Tips */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Tips for a good photo
                          </p>
                          <ul className="space-y-1.5">
                            {[
                              "Ensure all text is clearly legible",
                              "Include the full receipt in frame",
                              "Use good lighting to avoid shadows",
                            ].map((tip) => (
                              <li
                                key={tip}
                                className="flex items-start gap-2 text-xs text-gray-500"
                              >
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Action Buttons ───────────────────────────────────────── */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="pt-5 sm:pt-6">
              {/*
                Mobile  → stack vertically, buttons full-width on top, hint text below
                Desktop → hint text left, buttons right in a row
              */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  {item
                    ? "Update this expense record"
                    : "Record this expense for tracking"}
                </p>
                <div className="flex items-center justify-end gap-3">
                  <CancelButton />
                  <Separator
                    orientation="vertical"
                    className="h-6 hidden sm:block"
                  />
                  <SubmitButton
                    label={item ? "Update Expense" : "Record Expense"}
                    isPending={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default ExpenseForm;
