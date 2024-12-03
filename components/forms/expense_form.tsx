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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={`gap-1`}
      >
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <>
            <>
            <FormError message={error}/>
            <FormSuccess message={success}/>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter expense name"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                      <Input
                        placeholder="Enter expense amount"
                        {...field}
                        disabled={isPending}
                        value={field.value}
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
                    <FormItem>
                      <FormLabel>Expense Category</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isPending || expenseCategories.length === 0}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.length > 0
                              ? expenseCategories.map((expCat: ExpenseCategory, index: number) => (
                                  <SelectItem key={index} value={expCat.id}>
                                    {expCat.name}{" "}
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expense Date</FormLabel>
                      <DateTimePicker
                        field={field}
                        date={date}
                        setDate={setDate}
                        handleTimeChange={handleTimeChange}
                        onDateSelect={handleDateSelect}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
         

              </div>
            </>
          </>
          <div className="flex h-5 items-center space-x-4 mt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update expense details" : "Add expense"}
            />
          </div>
        </div>

        {/* </div> */}
      </form>
    </Form>
  );
}

export default ExpenseForm;
