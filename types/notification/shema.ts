import { boolean, object } from "zod";

export const NotificationSettingsSchema = object({
    enableEmailNotification: boolean().optional(),
    enablePushNotification: boolean().optional(),
    enableSmsNotification: boolean().optional(),
});