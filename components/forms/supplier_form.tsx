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
import { CustomerSchema } from "@/types/customer/schema";
import { createCustomer, updateCustomer } from "@/lib/actions/customer-actions";
import { toast, useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import GenderSelector from "@/components/widgets/gender-selector";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "../ui/switch";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { Supplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import { createSupplier, updateSupplier } from "@/lib/actions/supplier-actions";

function SupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
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

  const submitData = (values: z.infer<typeof SupplierSchema>) => {
    startTransition(() => {
      if (item) {
        updateSupplier(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createSupplier(values)
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
              <CardTitle>Supplier Details</CardTitle>
              <CardDescription>
                Enter personal details of the supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
            <FormError message={error}/>
            <FormSuccess message={success}/>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier first name "
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier phone number"
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
              label={item ? "Update supplier details" : "Add supplier "}
            />
          </div>
        </div>

        {/* </div> */}
      </form>
    </Form>
  );
}

export default SupplierForm;
