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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  LocationSettings,
  SETTINGS_CONFIG,
  SettingField,
  CATEGORY_TITLES,
} from "@/types/settings/type";
import { LocationSettingsSchema } from "@/types/settings/schema";
import { updateLocationSettings } from "@/lib/actions/settings-actions";
import Loading from "@/components/ui/loading";

const PANEL_CATEGORIES = ["notifications", "location-notifications"];

const NotificationsSettings = ({
  locationSettings,
}: {
  locationSettings?: LocationSettings | null | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

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
            description: "Notification settings updated successfully.",
          });
        }
      }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading notification settings...</p>
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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure notification channels and alert contacts for this location
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
          {/* Main notification toggles with icons */}
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="pt-6 space-y-1">
              <h3 className="text-lg font-medium mb-4">Notification Channels</h3>

              <FormField
                control={form.control}
                name="enableEmailNotifications"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <FormLabel className="text-sm font-medium cursor-pointer">Email Notifications</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="enableSmsNotifications"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <FormLabel className="text-sm font-medium cursor-pointer">SMS Notifications</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="enablePushNotifications"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <FormLabel className="text-sm font-medium cursor-pointer">Push Notifications</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Alert contacts & reports */}
          {settingsGroups["location-notifications"] && (
            <Card className="rounded-xl border shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-medium">
                  {CATEGORY_TITLES["location-notifications"]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingsGroups["location-notifications"].map((field) => {
                    const { key, type, placeholder, helperText, inputType } = field;

                    if (type === "switch") {
                      return (
                        <FormField
                          key={key}
                          control={form.control}
                          name={key as any}
                          render={({ field: formField }) => (
                            <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium cursor-pointer">{field.label}</FormLabel>
                                {helperText && <FormDescription className="text-xs">{helperText}</FormDescription>}
                              </div>
                              <FormControl>
                                <Switch checked={formField.value} onCheckedChange={formField.onChange} disabled={isPending} className="bg-green-500" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      );
                    }

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
                                type={inputType || "text"}
                                placeholder={placeholder}
                                disabled={isPending}
                                value={formField.value ?? ""}
                              />
                            </FormControl>
                            {helperText && <FormDescription>{helperText}</FormDescription>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-end">
            {isPending ? (
              <Button disabled>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </Button>
            ) : (
              <Button type="submit">
                Save Changes
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NotificationsSettings;
