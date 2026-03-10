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
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Loading notification settings...
                    </p>
                </div>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Get notified about what&apos;s happening — you can turn off at any time
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="rounded-xl border border-primary/10 shadow-sm overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                                    <Bell className="h-5 w-5 text-primary" />
                                </div>
                                <CardDescription className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    We can send you email, SMS, and push notifications for new direct messages
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <FormField
                                control={form.control}
                                name="enableEmailNotification"
                                render={({ field }) => (
                                    <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                                                <Mail className="h-4 w-4 text-primary" />
                                            </div>
                                            <FormLabel className="text-sm font-medium cursor-pointer">Email Notifications</FormLabel>
                                        </div>
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
                                    <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                                                <MessageSquare className="h-4 w-4 text-primary" />
                                            </div>
                                            <FormLabel className="text-sm font-medium cursor-pointer">SMS Notifications</FormLabel>
                                        </div>
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
                                    <FormItem className="flex justify-between items-center px-3 py-3.5 rounded-lg hover:bg-primary-light dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-gray-800">
                                                <Smartphone className="h-4 w-4 text-primary" />
                                            </div>
                                            <FormLabel className="text-sm font-medium cursor-pointer">Push Notifications</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-end pt-6">
                                <SubmitButton
                                    isPending={isPending}
                                    label="Save Changes"
                                    className="bg-primary hover:bg-primary/90 text-white rounded-lg"
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
