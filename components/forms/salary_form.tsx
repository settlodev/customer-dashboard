"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { SalarySchema } from "@/types/salary/schema";
import { createSalary, updateSalary } from "@/lib/actions/salary-actions";
import { Salary } from "@/types/salary/type";

function SalaryForm({ item }: { item: Salary | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error, ] = useState<string | undefined>("");
  const [success, ] = useState<string | undefined>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SalarySchema>>({
    resolver: zodResolver(SalarySchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof SalarySchema>) => {

    console.log("Submitting data:", values);
    startTransition(() => {
      if (item) {
        updateSalary(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createSalary(values)
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
              <CardTitle>Salary Details</CardTitle>
              <CardDescription>
                Add salary details for your staff to your business location
              </CardDescription>
            </CardHeader>
            <CardContent>
            <FormError message={error}/>
            <FormSuccess message={success}/>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter salary amount"
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
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter salary frequency"
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
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter bank name"
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
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account number"
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
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter branch"
                          {...field}
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
          <div className="flex h-5 items-center space-x-4 mt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update salary details" : "Add salary "}
            />
          </div>
        </div>

        {/* </div> */}
      </form>
    </Form>
  );
}

export default SalaryForm;


