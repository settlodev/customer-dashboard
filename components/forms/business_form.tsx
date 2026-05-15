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

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
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
    values.logoUrl = logoImage || null;

    startTransition(() => {
      if (item) {
        updateBusiness(item.id, values).then((data) => {
          if (data?.responseType === "success") {
            toast({ title: "Business updated", description: data.message });
          } else if (data?.responseType === "error") {
            toast({
              variant: "destructive",
              title: "Couldn't update business",
              description: data.message,
            });
          }
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
        className="space-y-6"
      >
        {/* 1 — Business profile */}
        <SectionCard
          title="Business profile"
          description="Identity, contact details and logo for the parent business."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
                  <FieldLabel>Business name</FieldLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Enter business name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FieldLabel>Phone number</FieldLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      value={field.value || ""}
                      placeholder="+255712345678"
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
                <FormItem className="space-y-1">
                  <FieldLabel>Email</FieldLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={isPending}
                      value={field.value || ""}
                      placeholder="info@business.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
                  <FieldLabel>Website</FieldLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      value={field.value || ""}
                      placeholder="https://yourbusiness.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
              <FieldLabel>Logo</FieldLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isPending}
                  className="cursor-pointer file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
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
                <p className="text-[11px] text-muted-foreground truncate">
                  {logoImage}
                </p>
              )}
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FieldLabel>Description</FieldLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isPending}
                    value={field.value || ""}
                    placeholder="Describe your business"
                    rows={3}
                    className="resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SectionCard>

        {/* 2 — Headquarters address */}
        <SectionCard
          title="Headquarters address"
          description="Where this business is registered."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="countryId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FieldLabel>Country</FieldLabel>
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
                <FormItem className="space-y-1">
                  <FieldLabel>Region</FieldLabel>
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
                <FormItem className="space-y-1">
                  <FieldLabel>District</FieldLabel>
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
                <FormItem className="space-y-1">
                  <FieldLabel>Ward</FieldLabel>
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
                <FormItem className="space-y-1">
                  <FieldLabel>Street address</FieldLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      value={field.value ?? ""}
                      placeholder="Street address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FieldLabel>Postal code</FieldLabel>
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
        </SectionCard>

        {/* Status toggle (only when editing) */}
        {item && (
          <Card className="rounded-xl border border-red-200 dark:border-red-900/40 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <>
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <div className="min-w-0 flex-1">
                        <FormLabel className="text-sm font-medium">
                          Business status
                        </FormLabel>
                        <FormDescription className="text-xs mt-0.5">
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

        {/* Sticky save bar */}
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-background/0 pt-4 pb-2 -mx-4 px-4 md:-mx-0 md:px-0">
          <div className="flex items-center justify-end gap-3">
            {isPending ? (
              <Button disabled className="w-full md:w-auto">
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                {item ? "Updating…" : "Processing…"}
              </Button>
            ) : (
              <Button type="submit" className="w-full md:w-auto">
                {item ? "Update business" : submitButtonText}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Layout primitives — match SettingsSection density
// ──────────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
      {children}
    </FormLabel>
  );
}

export default BusinessForm;
