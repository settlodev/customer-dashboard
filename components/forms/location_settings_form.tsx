"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent } from "@/components/ui/card";
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
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Loader2Icon } from "lucide-react";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import { toast } from "@/hooks/use-toast";
import {
  LocationSettings,
  SettingField,
  SETTINGS_CONFIG,
} from "@/types/settings/type";
import { LocationSettingsSchema } from "@/types/settings/schema";
import {
  PaymentDetails,
  PaymentDetailsModal,
} from "../settings/paymentDetailsModal";
import { ImageUploadModal } from "@/components/settings/uploadImage";

// Loading skeleton component (enhanced for dynamic fields)
const LoadingSkeleton = () => {
  const categories = [
    "basic",
    "feature",
    "printing",
    "inventory",
    "order",
    "notifications",
    "system",
  ];

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />
          </div>
        ))}

        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </CardContent>
    </Card>
  );
};

// Category titles mapping
const CATEGORY_TITLES = {
  basic: "Basic Settings",
  feature: "Feature Settings",
  // system: "System Settings",
  printing: "Printing Settings",
  inventory: "Inventory Settings",
  notifications: "Notifications Settings",
  receipt: "Receipt Settings",
  order: "Order Settings",
} as const;

// Helper to group settings by category
const groupSettingsByCategory = (settings: SettingField[]) => {
  return settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, SettingField[]>,
  );
};

// Helper to get appropriate grid class based on field type
const getGridClass = (fields: SettingField[]): string => {
  const hasInputFields = fields.some(
    (field) =>
      field.type === "input" ||
      field.type === "text" ||
      field.type === "password" ||
      field.type === "number",
  );

  if (hasInputFields) {
    return "grid grid-cols-1 md:grid-cols-3 gap-4";
  }

  return "grid grid-cols-1 md:grid-cols-2 gap-4";
};

const LocationSettingsForm = ({
  item,
}: {
  item: LocationSettings | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [, setResponse] = useState<FormResponse | undefined>();

  // Modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<
    "physical" | "digital"
  >("physical");

  // Store payment details and receipt image
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [physicalReceiptPaymentDetails, setPhysicalReceiptPaymentDetails] =
    useState<PaymentDetails>({ bankDetails: [], mnoDetails: [] });
  const [digitalReceiptPaymentDetails, setDigitalReceiptPaymentDetails] =
    useState<PaymentDetails>({ bankDetails: [], mnoDetails: [] });

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues: {
      ...item,
      status: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset(item);
      setIsLoading(false);
      // Load existing data if available
      // TODO: Load receipt image and payment details from item
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [item, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description:
        typeof errors.message === "string"
          ? errors.message
          : "There was an issue submitting your form, please try later",
    });
  }, []);

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {
    console.log("The submitted settings are", values);
    console.log("Receipt Image:", receiptImage);
    console.log(
      "Physical Receipt Payment Details:",
      physicalReceiptPaymentDetails,
    );
    console.log(
      "Digital Receipt Payment Details:",
      digitalReceiptPaymentDetails,
    );

    setResponse(undefined);

    startTransition(() => {
      if (item) {
        // TODO: Include receipt image and payment details in the update
        const dataToUpdate = {
          ...values,
          receiptImage,
          physicalReceiptPaymentDetails,
          digitalReceiptPaymentDetails,
        };

        updateLocationSettings(item.id, dataToUpdate as any).then((data) => {
          if (data) {
            setResponse(data);
            toast({
              title: "Settings Updated",
              description:
                "Your location settings have been updated successfully.",
            });
          }
        });
      }
    });
  };

  const getFilteredSettings = () => {
    const currentValues = form.watch();

    return SETTINGS_CONFIG.filter((setting) => {
      // Check dependencies if they exist
      if (setting.dependencies && setting.dependencies.length > 0) {
        return setting.dependencies.every(
          (dep) => currentValues[dep as keyof typeof currentValues],
        );
      }
      return true;
    });
  };

  const handleSwitchChange = (
    fieldKey: keyof LocationSettings,
    currentValue: boolean,
    onChange: (value: boolean) => void,
  ) => {
    // If turning ON, show the appropriate modal
    if (!currentValue) {
      if (fieldKey === "showImageOnReceipt") {
        setIsImageModalOpen(true);
        // Don't change the switch value yet
        return;
      } else if (fieldKey === "showAdditionalDetailsOnPhysicalReceipt") {
        setPaymentModalType("physical");
        setIsPaymentModalOpen(true);
        // Don't change the switch value yet
        return;
      } else if (fieldKey === "showAdditionalDetailsOnDigitalReceipt") {
        setPaymentModalType("digital");
        setIsPaymentModalOpen(true);
        // Don't change the switch value yet
        return;
      }
    }

    // For all other switches or when turning OFF, proceed normally
    onChange(!currentValue);
  };

  const handleImageSave = (imageUrl: string) => {
    setReceiptImage(imageUrl);
    form.setValue("showImageOnReceipt", true);
    setIsImageModalOpen(false);
  };

  const handlePaymentDetailsSave = (details: PaymentDetails) => {
    if (paymentModalType === "physical") {
      setPhysicalReceiptPaymentDetails(details);
      form.setValue("showAdditionalDetailsOnPhysicalReceipt", true);
    } else {
      setDigitalReceiptPaymentDetails(details);
      form.setValue("showAdditionalDetailsOnDigitalReceipt", true);
    }
    setIsPaymentModalOpen(false);
  };

  const renderFormControl = (field: SettingField) => {
    const { key, type, placeholder, helperText, inputType, min, max, step } =
      field;

    switch (type) {
      case "switch":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </FormLabel>
                  {helperText && (
                    <FormDescription className="text-xs">
                      {helperText}
                    </FormDescription>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={() =>
                      handleSwitchChange(
                        key,
                        formField.value,
                        formField.onChange,
                      )
                    }
                    disabled={isPending || field.disabled}
                    className="bg-green-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "input":
      case "text":
      case "password":
      case "number":
        return (
          <FormField
            key={key as any}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={
                      inputType ||
                      (type === "password"
                        ? "password"
                        : type === "number"
                          ? "number"
                          : "text")
                    }
                    placeholder={placeholder}
                    disabled={isPending || field.disabled}
                    value={formField.value ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                      if (type === "number") {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        formField.onChange(isNaN(value) ? 0 : value);
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        console.warn(`Unsupported field type: ${type} for field: ${key}`);
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const filteredSettings = getFilteredSettings();
  const settingsGroups = groupSettingsByCategory(filteredSettings);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitData, onInvalid)}
              className="space-y-6"
            >
              {Object.entries(settingsGroups).map(
                ([category, settings], index, array) => (
                  <React.Fragment key={category}>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        {CATEGORY_TITLES[
                          category as keyof typeof CATEGORY_TITLES
                        ] ||
                          category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>

                      <div className={getGridClass(settings)}>
                        {settings.map((field) => renderFormControl(field))}
                      </div>
                    </div>

                    {/* Don't add separator after last category */}
                    {index < array.length - 1 && <Separator />}
                  </React.Fragment>
                ),
              )}

              <div className="flex justify-end pt-6">
                {isPending ? (
                  <Button disabled className="w-full md:w-auto">
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Updating Settings...
                  </Button>
                ) : (
                  <Button type="submit" className="w-full md:w-auto">
                    Update Settings
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSave={handleImageSave}
        currentImage={receiptImage}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handlePaymentDetailsSave}
        currentDetails={
          paymentModalType === "physical"
            ? physicalReceiptPaymentDetails
            : digitalReceiptPaymentDetails
        }
        receiptType={paymentModalType}
      />
    </>
  );
};

export default LocationSettingsForm;
