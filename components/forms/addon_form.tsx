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
import React, { useCallback,useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { AddonSchema } from "@/types/addon/schema";
import { createAddon, updateAddon } from "@/lib/actions/addon-actions";
import { Addon } from "@/types/addon/type";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import TrackingOptions from "../widgets/tracker-selector";

function AddonForm({ item }: { item: Addon | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const [addonTracking, setAddonTracking] = useState<boolean>(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof AddonSchema>>({
    resolver: zodResolver(AddonSchema),
    defaultValues: { status: true },
  });


  const handleAddonTrackingChange = (value: boolean) => {
    setAddonTracking(value);
  };


  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof AddonSchema>) => {
    startTransition(() => {
      if (item) {
        updateAddon(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/addons");
          }
        });
      } else {
        createAddon(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/addons");
            }
          })
          .catch((error) => {
            console.log(error);
            toast({
              variant: "destructive",
              title: "Error",
              description: error
            });
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
        <div>
          <>

            <>
              <FormError message={error} />
              <FormSuccess message={success} />
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Addon Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter addon title e.g. Cheese"
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Addon Price</FormLabel>
                      <FormControl>
                        <NumericFormat
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                          value={field.value}
                          disabled={isPending}
                          placeholder="0.00"
                          thousandSeparator={true}
                          allowNegative={false}
                          onValueChange={(values) => {
                            const rawValue = Number(values.value.replace(/,/g, ""));
                            field.onChange(rawValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isTracked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                      <FormLabel>Allow Addon Tracking</FormLabel>
                      <FormControl>
                        <Switch

                          checked={field.value}
                          onCheckedChange={(value) => {
                            field.onChange(value);
                            handleAddonTrackingChange(value);
                          }}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {addonTracking && (
            <div className="mt-4">
              <TrackingOptions
                onSelectionChange={(selection) => {
                  console.log("Selected Tracking Option:", selection);
                  // Update form state or handle tracking option as needed
                }}
              />
            </div>
)}
                
                {item && (
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <FormLabel>Addon Status</FormLabel>
                          <FormControl>
                            <Switch

                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )
                }
              </div>
            </>
          </>
          <div className="flex h-5 items-center space-x-4 mt-10">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update Addon details" : "Add Addon"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default AddonForm;
