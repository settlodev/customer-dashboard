"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { Discount } from "@/types/discount/type";
import { DiscountSchema } from "@/types/discount/schema";
import { createDiscount, updateDiscount } from "@/lib/actions/discount-actions";
import DiscountTypeSelector from "../widgets/discount-type-selector";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns"
import { Calendar } from "../ui/calendar";
import { formatNumber, formatDateForZod } from "@/lib/utils";




function DiscountForm({ item }: { item: Discount | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [validFrom, setValidFrom] = useState<Date | undefined>(item?.validFrom ? new Date(item.validFrom) : undefined); 
  const [validTo, setValidTo] = useState<Date | undefined>(item?.validTo ? new Date(item.validTo) : undefined); 
  const { toast } = useToast();

  const form = useForm<z.infer<typeof DiscountSchema>>({
    resolver: zodResolver(DiscountSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: any) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof DiscountSchema>) => {
    startTransition(() => {
      if (item) {
        updateDiscount(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createDiscount(values)
          .then((data) => {
            console.log(data);
            if (data) setResponse(data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={`gap-1`}
      >
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Discount Details</CardTitle>
              <CardDescription>
                Enter the details of the discount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormError message={error} />
              <FormSuccess message={success} />
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter discount name"
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
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <FormControl>
                        <DiscountTypeSelector
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isRequired
                          isDisabled={isPending}
                          label="Discount Type"
                          placeholder="Select discount type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter discount value"
                          {...field}
                          disabled={isPending}
                          value={field.value ? formatNumber(field.value) : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, '');
                            field.onChange(value ? parseFloat(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumSpend"
                  render={({ field }) => (
                    <FormItem className="flex flex-col lg:mt-4">
                      <FormLabel>Minimum Spend</FormLabel>
                      <FormControl>

                        <Input
                          placeholder="Enter minimum spend for discount,if customer has spend X or more amount"
                          {...field}
                          disabled={isPending}
                          value={field.value ? formatNumber(field.value) : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, '');
                            field.onChange(value ? parseFloat(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem className="flex flex-col lg:mt-4">
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>

                        <Input
                          placeholder="Enter usage limit for discount"
                          {...field}
                          disabled={isPending}
                          value={field.value ? formatNumber(field.value) : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, '');
                            field.onChange(value ? parseFloat(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <input
                                {...field}
                                type="text"
                                readOnly
                                className={cn(
                                  "w-full p-2 border rounded-md text-left font-normal",
                                  !validFrom && "text-muted-foreground"
                                )}
                                value={validFrom ? format(validFrom, "PPP") : "Pick a date"}
                                disabled={isPending}
                              />
                              <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={validFrom}
                              onSelect={(date) => {
                                setValidFrom(date);
                                field.onChange(formatDateForZod(date));
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <input
                                {...field}
                                type="text"
                                readOnly
                                className={cn(
                                  "w-full p-2 border rounded-md text-left font-normal",
                                  !validTo && "text-muted-foreground"
                                )}
                                value={validTo ? format(validTo, "PPP") : "Pick a date"}
                                disabled={isPending}
                              />
                              <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={validTo}
                              onSelect={(date) => {
                                setValidTo(date);
                                field.onChange(formatDateForZod(date));
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </CardContent>
          </Card>
          <div className="flex h-5 items-center space-x-4 mt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update discount details" : "Add discount"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default DiscountForm;
