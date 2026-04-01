"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  LocationSettings,
  SETTINGS_CONFIG,
  SettingField,
  CATEGORY_TITLES,
} from "@/types/settings/type";
import { LocationSettingsSchema } from "@/types/settings/schema";
import { updateLocationSettings, resetLocationSettings } from "@/lib/actions/settings-actions";
import Loading from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Categories shown on this panel
const PANEL_CATEGORIES = [
  "operations",
  "pos",
  "orders",
  "order-naming",
  "tipping",
  "tax",
  "settlement",
  "day-sessions",
  "stock-movement",
  "inventory-flags",
];

const LocationSettingsPanel = ({
  locationSettings,
}: {
  locationSettings: LocationSettings | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const form = useForm<z.infer<typeof LocationSettingsSchema>>({
    resolver: zodResolver(LocationSettingsSchema),
    defaultValues: { ...locationSettings, status: true },
  });

  useEffect(() => {
    if (locationSettings) {
      form.reset(locationSettings as any);
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [locationSettings, form]);

  const onInvalid = useCallback((errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please check the form fields and try again.",
    });
  }, []);

  const submitData = (values: z.infer<typeof LocationSettingsSchema>) => {
    startTransition(async () => {
      if (locationSettings) {
        const data = await updateLocationSettings(locationSettings.id, values as any);
        if (data) {
          toast({
            title: "Settings Updated",
            description: "Location settings have been updated successfully.",
          });
        }
      }
    });
  };

  const handleReset = () => {
    if (!locationSettings?.locationId) return;
    startTransition(async () => {
      const result = await resetLocationSettings(locationSettings.locationId!);
      if (result.responseType === "success") {
        toast({ title: "Settings Reset", description: result.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setShowResetDialog(false);
    });
  };

  const getFilteredSettings = () => {
    const currentValues = form.watch();
    return SETTINGS_CONFIG.filter((setting) => {
      if (!PANEL_CATEGORIES.includes(setting.category)) return false;
      if (setting.dependencies?.length) {
        return setting.dependencies.every(
          (dep) => currentValues[dep as keyof typeof currentValues],
        );
      }
      return true;
    });
  };

  const renderFormControl = (field: SettingField) => {
    const { key, type, placeholder, helperText, inputType, min, max, step } = field;

    switch (type) {
      case "switch":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    {field.label}
                  </FormLabel>
                  {helperText && (
                    <FormDescription className="text-xs">{helperText}</FormDescription>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={isPending || field.disabled}
                    className="bg-green-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case "select":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Select
                    value={formField.value ?? ""}
                    onValueChange={formField.onChange}
                    disabled={isPending || field.disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={placeholder || "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    {...formField}
                    value={formField.value ?? ""}
                    placeholder={placeholder}
                    disabled={isPending || field.disabled}
                    className="min-h-[80px]"
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            key={key}
            control={form.control}
            name={key as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={inputType || (type === "number" ? "number" : "text")}
                    placeholder={placeholder}
                    disabled={isPending || field.disabled}
                    value={formField.value ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                      if (type === "number") {
                        const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
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
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Location Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading settings...</p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 flex items-center justify-center"><Loading /></CardContent>
        </Card>
      </div>
    );
  }

  const filteredSettings = getFilteredSettings();
  const settingsGroups = filteredSettings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) acc[setting.category] = [];
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, SettingField[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Location Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure operations, POS, orders, tax, inventory, and other location-specific settings
          </p>
        </div>
        {locationSettings && (
          <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
          {Object.entries(settingsGroups).map(
            ([category, settings], index, array) => (
              <React.Fragment key={category}>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        {CATEGORY_TITLES[category] || category}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settings.map((field) => renderFormControl(field))}
                    </div>
                  </CardContent>
                </Card>
                {index < array.length - 1 && <Separator />}
              </React.Fragment>
            ),
          )}

          <div className="flex justify-end">
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

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Location Settings</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all location settings to their default values? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationSettingsPanel;
