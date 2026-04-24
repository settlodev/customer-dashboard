"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import {
  Building2,
  Globe,
  Loader2Icon,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Business } from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";
import { updateBusiness } from "@/lib/actions/business-actions";
import CountrySelector from "../widgets/country-selector";

type BusinessFormValues = z.infer<typeof BusinessSchema>;

const BusinessForm = ({
  item,
  onSubmit,
  submitButtonText = "Setup business",
}: {
  item: Business | null | undefined;
  onSubmit: (values: BusinessFormValues) => void;
  submitButtonText?: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [logoImage, setLogoImage] = useState(item?.logoUrl || "");

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(BusinessSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      phoneNumber: item?.phoneNumber ?? "",
      email: item?.email ?? "",
      website: item?.website ?? "",
      active: item ? item.active : true,
      countryId: item?.countryId ?? "",
      region: item?.region ?? "",
      district: item?.district ?? "",
      ward: item?.ward ?? "",
      address: item?.address ?? "",
      postalCode: item?.postalCode ?? "",
      logoUrl: item?.logoUrl ?? "",
    },
  });

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("Errors during form submission:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! something went wrong",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: BusinessFormValues) => {
    setResponse(undefined);
    values.logoUrl = logoImage || null;

    startTransition(() => {
      if (item) {
        updateBusiness(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        onSubmit(values);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="mx-auto space-y-8"
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* ─── Business profile ─── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Business profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Identity, contact details, and where the business is based
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            placeholder="Enter business name"
                          />
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
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="+255712345678"
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="info@business.com"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="https://yourbusiness.com"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isPending}
                        value={field.value || ""}
                        placeholder="Describe your business"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isPending}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const { uploadImage } = await import("@/lib/utils");
                        uploadImage(file, "business/logos", (res) => {
                          if (res.success) setLogoImage(res.data);
                        });
                      }
                    }}
                  />
                </FormControl>
                {logoImage && (
                  <p className="text-xs text-muted-foreground truncate">
                    {logoImage}
                  </p>
                )}
              </FormItem>
            </div>

            {/* ─── Address ─── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Headquarters address</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Where this business is registered
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <CountrySelector
                          {...field}
                          defaultCode="TZ"
                          isDisabled={isPending}
                          label="Select business country"
                          placeholder="Select country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value ?? ""}
                          placeholder="e.g. Dar es Salaam"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value ?? ""}
                          placeholder="District"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value ?? ""}
                          placeholder="Ward"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value ?? ""}
                            placeholder="Street address"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value ?? ""}
                          placeholder="Postal code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              {isPending ? (
                <Button disabled className="w-full md:w-auto">
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  {item ? "Updating..." : "Processing..."}
                </Button>
              ) : (
                <Button type="submit" className="w-full md:w-auto">
                  {item ? "Update business" : submitButtonText}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {item && (
          <Card className="rounded-xl border border-red-200 shadow-sm">
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <>
                    <FormItem className="flex flex-row items-center justify-between">
                      <div>
                        <FormLabel className="text-base">Business status</FormLabel>
                        <FormDescription>
                          This business is currently{" "}
                          <span
                            className={
                              field.value
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {field.value ? "enabled" : "disabled"}
                          </span>
                        </FormDescription>
                      </div>
                      <Button
                        type="button"
                        variant={field.value ? "destructive" : "default"}
                        size="sm"
                        disabled={isPending}
                        onClick={() => setShowStatusDialog(true)}
                      >
                        {field.value ? "Disable" : "Enable"}
                      </Button>
                      <FormMessage />
                    </FormItem>

                    <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {field.value ? "Disable" : "Enable"} business
                          </DialogTitle>
                          <DialogDescription>
                            {field.value
                              ? "Are you sure you want to disable this business? This will make it inactive and may affect all associated locations and services."
                              : "Are you sure you want to enable this business? This will make it active again."}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowStatusDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant={field.value ? "destructive" : "default"}
                            onClick={() => {
                              field.onChange(!field.value);
                              setShowStatusDialog(false);
                            }}
                          >
                            {field.value ? "Disable" : "Enable"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              />
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};

export default BusinessForm;
