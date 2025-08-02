"use client";

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
import React, { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import { Supplier } from "@/types/supplier/type";
import { SupplierSchema } from "@/types/supplier/schema";
import {Building2, Loader2Icon, Mail, MapPin, Phone, User} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/widgets/form-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSuccess } from "@/components/widgets/form-success";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import { createSupplier, updateSupplier } from "@/lib/actions/warehouse/supplier-actions";

function WarehouseSupplierForm({ item }: { item: Supplier | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,setError] = useState<string | undefined>("");
  const [success,setSuccess] = useState<string | undefined>("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: item ? item : { status: true },
  });

  const submitData = (values: z.infer<typeof SupplierSchema>) => {
    // Clear previous messages
    setError("");
    setSuccess("");
    
    startTransition(() => {
      if (item) {
        updateSupplier(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            setSuccess(data.message);
            toast({
              title: "Success",
              description: data.message,
              duration: 5000
            });
            router.push("/warehouse-suppliers");
          } else if (data && data.responseType === "error") {
            setError(data.message);
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
              duration: 5000
            });
          }
        });
      } else {
        createSupplier(values)
          .then((data) => {
            console.log(data);
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              setSuccess(data.message);
              toast({
                title: "Success",
                description: data.message,
                duration: 5000
              });
              router.push("/warehouse-suppliers");
            } else if (data && data.responseType === "error") {
              setError(data.message);
              toast({
                title: "Error",
                description: data.message,
                variant: "destructive",
                duration: 5000
              });
            }
          })
          .catch((err) => {
            console.log(err);
            const errorMessage = "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
              duration: 5000
            });
          });
      }
    });
  };

return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(submitData)}>
            <div className="space-y-8">
                <FormError message={error} />
                <FormSuccess message={success} />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Supplier Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-10"
                                                placeholder="Enter supplier full name"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </div>
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
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input className="pl-10" placeholder="johndoe@example.com" {...field} />
                                        </div>
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
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <div className="relative border border-gray-200 rounded-md">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <PhoneInput
                                                className="pl-10"
                                                placeholder="Enter supplier phone number"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="physicalAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Physical Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-10"
                                                placeholder="Enter supplier physical address"
                                                {...field}
                                                disabled={isPending}
                                                value={field.value || ""}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Contact Person Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="contactPersonName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person Name</FormLabel>
                                    <FormControl>
                                        <div className="relative border-gray-200 rounded-md">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-10"
                                                {...field}
                                                disabled={isPending}
                                                placeholder="Enter contact person name"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPersonTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Job Title
                                        <span className="text-gray-400 text-sm ml-2">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="Enter contact person title"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPersonPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Phone Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <PhoneInput
                                                className="pl-10"
                                                {...field}
                                                disabled={isPending}
                                                placeholder="Enter contact person phone number"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPersonEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Contact Email
                                        <span className="text-gray-400 text-sm ml-2">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                className="pl-10"
                                                {...field}
                                                disabled={isPending}
                                                placeholder="contact@example.com"
                                                value={field.value || ""}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {item && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div>
                                    <FormLabel className="text-base">Supplier Status</FormLabel>
                                    <span className={`ml-2 ${item.status ? "text-green-500" : "text-red-500"}`}>
                      ({item.status ? "Active" : "Inactive"})
                    </span>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isPending}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex items-center space-x-4 pt-6">
                    <CancelButton />
                    <Separator orientation="vertical" className="h-8" />
                    {isPending ? (
                        <button disabled className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md">
                            <Loader2Icon className="w-5 h-5 animate-spin" />
                            Processing
                        </button>
                    ) : (
                        <SubmitButton
                            isPending={isPending}
                            label={item ? "Update supplier details" : "Add supplier"}
                        />
                    )}
                </div>
            </div>
        </form>
    </Form>
    );
}

export default WarehouseSupplierForm;
