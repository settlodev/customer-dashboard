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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import DateTimePicker from "../widgets/datetimepicker";
import { useRouter } from "next/navigation";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";
import { CalendarDays, Receipt, Tags, User2, DollarSign, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NumericFormat } from "react-number-format";


function ExpenseForm({ item }: { item: Expense | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error, ] = useState<string | undefined>("");
  const [success, ] = useState<string | undefined>("");
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    []
  );
  const [date, setDate] = useState<Date | undefined>(
    item?.date ? new Date(item.date) : undefined
  );
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const getExpenseCategories = async () => {
      try {
        const response = await fetchExpenseCategories();
        setExpenseCategories(response);
      } catch (error) {
        console.error("Error fetching countries", error);
      }
    };
    getExpenseCategories();
  }, []);

  const form = useForm<z.infer<typeof ExpenseSchema>>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: item ? item : { status: true },
  });


  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof ExpenseSchema>) => {
    startTransition(() => {
      if (item) {
        updateExpense(item.id, values).then((data) => {
          if (data) {
            setResponse(data);
            if (data.responseType === "success") {
              toast({
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
                  title: "Success",
                  description: data.message,
                });
                router.push("/expenses");
              }
            }
          })
          .catch((err) => {
            console.error(err);
          });
      }
    });
  };

  const handleTimeChange = (type: "hour" | "minutes", value: string) => {
    if (!date) return;

    const newDate = new Date(date);

    if (type === "hour") {
      newDate.setHours(Number(value));
    } else if (type === "minutes") {
      newDate.setMinutes(Number(value));
    }

    setDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setDate(date);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-8">
          <FormError message={error}/>
          <FormSuccess message={success}/>

          {/* Main Form Card */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-5 w-5"/>
                Expense Information
              </CardTitle>
              <CardDescription>
                Enter the basic details about this expense
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({field}) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Receipt className="h-4 w-4"/>
                        Expense Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter expense name"
                          disabled={isPending}
                          className="h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseCategory"
                  render={({field}) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Tags className="h-4 w-4"/>
                        Category
                      </FormLabel>
                      <Select
                        disabled={isPending || expenseCategories.length === 0}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select category"/>
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
                      <FormMessage/>
                    </FormItem>
                  )}
                />

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <FormField
                  control={form.control}
                  name="date"
                  render={({field}) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CalendarDays className="h-4 w-4"/>
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
                      <FormMessage/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staff"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User2 className="h-4 w-4"/>
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
                      <FormMessage/>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-5 w-5"/>
                Payment Information
              </CardTitle>
              <CardDescription>
                Track the total amount and payment status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({field}) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <DollarSign className="h-4 w-4"/>
                        Total Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                        <NumericFormat
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={field.value ?? ''}
                          onValueChange={(values) => {
                          field.onChange(Number(values.value));
                          }}
                          thousandSeparator={true}
                          placeholder="Enter total expense amount"
                          disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({field}) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CreditCard className="h-4 w-4"/>
                        Paid Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          
                        <NumericFormat
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={field.value ?? ''}
                          onValueChange={(values) => {
                          field.onChange(Number(values.value));
                          }}
                          thousandSeparator={true}
                          placeholder="Enter paid expense amount"
                          disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {item ? "Update this expense record" : "Record this expense for tracking"}
                </div>
                <div className="flex items-center space-x-4">
                  <CancelButton/>
                  <Separator orientation="vertical" className="h-6"/>
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
};

export default ExpenseForm;