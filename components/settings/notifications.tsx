'use client'
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader} from "../ui/card";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

const NotificationSettings = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Notifications</h2>
                <p className="text-muted-foreground mt-1">
                    Get notified what&apos;s happening right now, you can turn off at any time
                </p>
            </div>

            <Card>
                <CardHeader>
                    {/* <CardTitle>Email Notifications</CardTitle> */}
                    <CardDescription className="text-base font-medium text-black">
                        Substance can send you email, SMS, and push notifications for any new direct messages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Email Notifications</Label>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">SMS Notifications</Label>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Push Notifications</Label>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* <Card>
                <CardHeader>
                    <CardTitle>More Activity</CardTitle>
                    <CardDescription>
                        Substance can send you email notifications for any new direct messages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium">More Activity</Label>
                        </div>
                        <Switch
                            checked={moreActivity}
                            onCheckedChange={setMoreActivity}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="all-reminders"
                                name="activity-type"
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="all-reminders" className="font-medium">
                                    All Reminders & Activity
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Notify me all system activities and reminders that have been created
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="activity-only"
                                name="activity-type"
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="activity-only" className="font-medium">
                                    Activity only
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Only notify me we have the latest activity updates about increasing or decreasing data
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="important-only"
                                name="activity-type"
                                defaultChecked
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="important-only" className="font-medium">
                                    Important Reminder only
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Only notify me all the reminders that have been made
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
};

export default NotificationSettings;