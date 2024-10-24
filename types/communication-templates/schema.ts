import { boolean, nativeEnum, object, string } from "zod";
import { broadcastType } from "../enums";

export const TemplateSchema = object({
    message: string({ message: "Message is required" }).min(3, "Message should be at least 3 characters"),
    subject: string({ required_error: "Subject is required" }),
    broadcastType: nativeEnum(broadcastType),
    status: boolean().optional(),
});