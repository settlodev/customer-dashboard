'use client'
import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader} from "../ui/card";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { useForm } from "react-hook-form";
import { NotificationSettingsSchema } from "@/types/notification/shema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import SubmitButton from "../widgets/submit-button";
import { updateNotificationSetting } from "@/lib/actions/settings-actions";
import { fetchLocationSettings } from "@/lib/actions/settings-actions";

const NotificationSettings = () => {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof NotificationSettingsSchema>>({
        resolver: zodResolver(NotificationSettingsSchema),
        defaultValues: {
            enableEmailNotification: false,
            enablePushNotification: false,
            enableSmsNotification: false,
        },
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setIsLoading(true);
                const locationSettings = await fetchLocationSettings();
                
                // Update form with fetched values
                form.reset({
                    enableEmailNotification: locationSettings.enableEmailNotifications,
                    enablePushNotification: locationSettings.enablePushNotifications,
                    enableSmsNotification: locationSettings.enableSmsNotifications,
                });
            } catch (error) {
                console.error("Failed to fetch location settings:", error);
                
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [form]);

    const onSubmit = (values: z.infer<typeof NotificationSettingsSchema>) => {
        console.log("values are:", values);
        startTransition(() => {
            updateNotificationSetting(values);
        });
    }
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold">Notifications</h2>
                    <p className="text-muted-foreground mt-1">
                        Loading notification settings...
                    </p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Notifications</h2>
                <p className="text-muted-foreground mt-1">
                    Get notified what&apos;s happening right now, you can turn off at any time
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardDescription className="text-base font-medium text-black">
                                We can send you email, SMS, and push notifications for any new direct messages
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="enableEmailNotification"
                                render={({ field }) => (
                                    <FormItem className="flex justify-between items-center space-x-3 space-y-0">
                                        <FormLabel className="text-sm font-medium">Email Notifications</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <Separator />

                            <FormField
                                control={form.control}
                                name="enableSmsNotification"
                                render={({ field }) => (
                                    <FormItem className="flex justify-between items-center space-x-3 space-y-0">
                                        <FormLabel className="text-sm font-medium">SMS Notifications</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <Separator />
                            
                            <FormField
                                control={form.control}
                                name="enablePushNotification"
                                render={({ field }) => (
                                    <FormItem className="flex justify-between items-center space-x-3 space-y-0">
                                        <FormLabel className="text-sm font-medium">Push Notifications</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <div className="flex items-center justify-end space-x-2 pt-6">
                                <SubmitButton
                                    isPending={isPending}
                                    label="Save Changes"
                                />
                            </div> 
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
};

export default NotificationSettings;