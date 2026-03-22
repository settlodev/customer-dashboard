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
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2Icon,
  Mail,
  Phone,
  Palette,
  Type,
  Search,
  X,
  Youtube,
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

import { Separator } from "../ui/separator";
import { Business } from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";
import { updateBusiness } from "@/lib/actions/business-actions";
import BusinessTypeSelector from "../widgets/business-type-selector";
import CountrySelector from "../widgets/country-selector";
import { BusinessType } from "@/types/enums";

const BusinessForm = ({
  item,
  onSubmit,
  submitButtonText = "Setup business",
}: {
  item: Business | null | undefined;
  onSubmit: (values: z.infer<typeof BusinessSchema>) => void;
  submitButtonText?: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [logoImage, setLogoImage] = useState(item?.logo || "");
  const [bannerImage, setBannerImage] = useState(item?.bannerImageUrl || "");
  const [faviconImage, setFaviconImage] = useState(item?.faviconUrl || "");
  const [shareImage, setShareImage] = useState(item?.shareImageUrl || "");

  const form = useForm<z.infer<typeof BusinessSchema>>({
    resolver: zodResolver(BusinessSchema),
    defaultValues: {
      ...item,
      status: item ? item.status : true,
      businessType: item ? item.businessType : BusinessType.RETAIL,

      logo: item ? item.logo : undefined,
      notificationPhone: item ? item.notificationPhone : undefined,
      notificationEmailAddress: item
        ? item.notificationEmailAddress
        : undefined,
      vrn: item ? item.vrn : undefined,
      uin: item ? item.uin : undefined,
      serial: item ? item.serial : undefined,
      memarts: item ? item.memarts : undefined,
      businessLicense: item ? item.businessLicense : "",
      certificateOfIncorporation: item ? item.certificateOfIncorporation : null,
      identificationNumber: item ? item.identificationNumber : "",
      businessIdentificationDocument: item
        ? item.businessIdentificationDocument
        : null,
      receiptPrefix: item ? item.receiptPrefix : null,
      receiptSuffix: item ? item.receiptSuffix : null,
      receiptImage: item ? item.receiptImage : null,
      website: item ? item.website : null,
      linkedin: item ? item.linkedin : null,
      tiktok: item ? item.tiktok : null,
      vfdRegistrationState: item ? item.vfdRegistrationState : false,
      primaryColor: item?.primaryColor ?? "#EB7F44",
      secondaryColor: item?.secondaryColor ?? "#1A1A2E",
      bannerImageUrl: item?.bannerImageUrl ?? null,
      faviconUrl: item?.faviconUrl ?? null,
      fontFamily: item?.fontFamily ?? null,
      metaTitle: item?.metaTitle ?? null,
      metaDescription: item?.metaDescription ?? null,
      shareImageUrl: item?.shareImageUrl ?? null,
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
  const submitData = (values: z.infer<typeof BusinessSchema>) => {
    setResponse(undefined);
    values.logo = logoImage || null;
    values.bannerImageUrl = bannerImage || null;
    values.faviconUrl = faviconImage || null;
    values.shareImageUrl = shareImage || null;

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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
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
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <BusinessTypeSelector
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isRequired
                          isDisabled={isPending}
                          label="Business Type"
                          placeholder="Select business type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <CountrySelector
                          {...field}
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
                  name="notificationEmailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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

                <FormField
                  control={form.control}
                  name="notificationPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Phone</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <X className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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
                <FormField
                  control={form.control}
                  name="youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Youtube</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
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
                <FormField
                  control={form.control}
                  name="tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="https://tiktok.com/@yourbusiness"
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tax & VFD</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="identificationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN (Identification Number)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="TIN-12345678"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vrn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VRN (VAT Registration Number)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="VRN-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="SER-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UIN</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="UIN-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Receipts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Prefix</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="e.g. PI"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiptSuffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Suffix</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="e.g. TZ"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Branding & SEO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Palette className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="#EB7F44"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Palette className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="#1A1A2E"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fontFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Family</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Type className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="Inter"
                          />
                        </div>
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
                  {logoImage && <p className="text-xs text-muted-foreground truncate">{logoImage}</p>}
                </FormItem>
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isPending}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { uploadImage } = await import("@/lib/utils");
                          uploadImage(file, "business/banners", (res) => {
                            if (res.success) setBannerImage(res.data);
                          });
                        }
                      }}
                    />
                  </FormControl>
                  {bannerImage && <p className="text-xs text-muted-foreground truncate">{bannerImage}</p>}
                </FormItem>
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isPending}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { uploadImage } = await import("@/lib/utils");
                          uploadImage(file, "business/favicons", (res) => {
                            if (res.success) setFaviconImage(res.data);
                          });
                        }
                      }}
                    />
                  </FormControl>
                  {faviconImage && <p className="text-xs text-muted-foreground truncate">{faviconImage}</p>}
                </FormItem>
                <FormItem>
                  <FormLabel>Share Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isPending}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const { uploadImage } = await import("@/lib/utils");
                          uploadImage(file, "business/share", (res) => {
                            if (res.success) setShareImage(res.data);
                          });
                        }
                      }}
                    />
                  </FormControl>
                  {shareImage && <p className="text-xs text-muted-foreground truncate">{shareImage}</p>}
                </FormItem>
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                            value={field.value || ""}
                            placeholder="My Business - Best Restaurant"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>SEO Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={isPending}
                          value={field.value || ""}
                          placeholder="Welcome to our restaurant..."
                          className="min-h-[80px]"
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
                  {item ? "Update Business" : submitButtonText}
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
                name="status"
                render={({ field }) => (
                  <>
                    <FormItem className="flex flex-row items-center justify-between">
                      <div>
                        <FormLabel className="text-base">Business Status</FormLabel>
                        <FormDescription>
                          This business is currently{" "}
                          <span className={field.value ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
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
                            {field.value ? "Disable" : "Enable"} Business
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
