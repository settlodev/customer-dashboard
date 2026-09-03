"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Building2,
  Compass,
  Globe,
  Hash,
  Home,
  ImageIcon,
  Mail,
  Map,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
} from "@/components/ui/field";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { SectionCard } from "@/components/settings/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SettingsSaveBar } from "@/components/settings/shared/settings-save-bar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

  const dirtyCount = Object.keys(form.formState.dirtyFields).length;

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
    const logoUrl = values.logoUrl?.trim() ?? "";
    // The update endpoint has PATCH semantics: null = "leave the logo alone",
    // so a removed logo has to travel as an empty string, which the backend
    // stores as null. On create there is nothing to clear, so send null.
    const payload: BusinessFormValues = {
      ...values,
      logoUrl: logoUrl ? logoUrl : item ? "" : null,
    };

    startTransition(() => {
      if (item) {
        updateBusiness(item.id, payload).then((data) => {
          if (data?.responseType === "success") {
            form.reset(values);
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
        onSubmit(payload);
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
          icon={<Building2 className="h-4 w-4" />}
          title="Business profile"
          description="Identity, contact details and logo for the parent business."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px] sm:col-span-2">
                    <FieldLabel required>Business name</FieldLabel>
                    <FormControl>
                      <ControlInput
                        {...field}
                        prefix={<Building2 className="h-3.5 w-3.5" />}
                        disabled={isPending}
                        placeholder="e.g. Kariakoo Traders"
                        autoComplete="organization"
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
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>Phone number</FieldLabel>
                    <FormControl>
                      <ControlInput
                        {...field}
                        value={field.value ?? ""}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        prefix={<Phone className="h-3.5 w-3.5" />}
                        disabled={isPending}
                        placeholder="+255 712 345 678"
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
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>Email</FieldLabel>
                    <FormControl>
                      <ControlInput
                        {...field}
                        value={field.value ?? ""}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        prefix={<Mail className="h-3.5 w-3.5" />}
                        disabled={isPending}
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
                  <FormItem className="min-w-0 space-y-[7px] sm:col-span-2">
                    <FieldLabel optional>Website</FieldLabel>
                    <FormControl>
                      <ControlInput
                        {...field}
                        value={field.value ?? ""}
                        type="url"
                        inputMode="url"
                        autoComplete="url"
                        prefix={<Globe className="h-3.5 w-3.5" />}
                        disabled={isPending}
                        placeholder="https://yourbusiness.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px] sm:col-span-2">
                    <FieldLabel optional>Description</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        placeholder="What does this business do?"
                        rows={3}
                        maxLength={2000}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem className="flex min-w-0 flex-col space-y-[7px] lg:col-span-1">
                  <FieldLabel optional>
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Logo
                  </FieldLabel>
                  <FormControl>
                    <ImageDropzone
                      className="flex-1"
                      purpose="BUSINESS_LOGO"
                      value={field.value ?? ""}
                      onChange={(url) => field.onChange(url ?? "")}
                      onBlur={field.onBlur}
                      disabled={isPending}
                      maxSizeMb={5}
                      alt="Business logo"
                      ctaLabel="Upload logo"
                    />
                  </FormControl>
                  <FieldHint>
                    Appears on receipts, invoices and the POS. A square PNG on a
                    transparent background works best.
                  </FieldHint>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* 2 — Headquarters address */}
        <SectionCard
          icon={<MapPin className="h-4 w-4" />}
          title="Headquarters address"
          description="Where this business is registered."
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="countryId"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel required>Country</FieldLabel>
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel>Region</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      value={field.value ?? ""}
                      prefix={<MapPin className="h-3.5 w-3.5" />}
                      disabled={isPending}
                      placeholder="e.g. Dar es Salaam"
                      autoComplete="address-level1"
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel>District</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      value={field.value ?? ""}
                      prefix={<Map className="h-3.5 w-3.5" />}
                      disabled={isPending}
                      placeholder="e.g. Ilala"
                      autoComplete="address-level2"
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel>Ward</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      value={field.value ?? ""}
                      prefix={<Compass className="h-3.5 w-3.5" />}
                      disabled={isPending}
                      placeholder="e.g. Kariakoo"
                      autoComplete="address-level3"
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel>Street address</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      value={field.value ?? ""}
                      prefix={<Home className="h-3.5 w-3.5" />}
                      disabled={isPending}
                      placeholder="Street, building, floor"
                      autoComplete="street-address"
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel>Postal code</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      value={field.value ?? ""}
                      mono
                      prefix={<Hash className="h-3.5 w-3.5" />}
                      disabled={isPending}
                      placeholder="e.g. 11101"
                      autoComplete="postal-code"
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
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <SectionCard
                icon={
                  field.value ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldOff className="h-4 w-4" />
                  )
                }
                title="Business status"
                description="Disabling stops every location under this business from trading."
                tone={field.value ? "default" : "danger"}
              >
                <FormItem className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        field.value ? "bg-pos" : "bg-neg",
                      )}
                    />
                    <p className="text-sm text-ink-2">
                      This business is currently{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          field.value ? "text-pos" : "text-neg",
                        )}
                      >
                        {field.value ? "enabled" : "disabled"}
                      </span>
                      {form.formState.dirtyFields.active && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.06em] text-warn">
                          unsaved
                        </span>
                      )}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant={field.value ? "destructive" : "default"}
                        size="sm"
                        disabled={isPending}
                        className="w-full sm:w-auto"
                      >
                        {field.value ? "Disable business" : "Enable business"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent tone={field.value ? "danger" : "success"}>
                      <AlertDialogIcon>
                        {field.value ? (
                          <ShieldOff className="h-5 w-5" />
                        ) : (
                          <ShieldCheck className="h-5 w-5" />
                        )}
                      </AlertDialogIcon>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {field.value ? "Disable this business?" : "Enable this business?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {field.value
                            ? "Every location under this business stops trading until it is enabled again. The change applies when you save."
                            : "Locations under this business can trade again. The change applies when you save."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => field.onChange(!field.value)}>
                          {field.value ? "Disable" : "Enable"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <FormMessage />
                </FormItem>
              </SectionCard>
            )}
          />
        )}

        <SettingsSaveBar
          submit
          dirtyCount={dirtyCount}
          isPending={isPending}
          onDiscard={() => form.reset()}
          saveLabel={item ? "Update business" : submitButtonText}
          pendingLabel={item ? "Updating…" : "Processing…"}
        />
      </form>
    </Form>
  );
};

export default BusinessForm;
