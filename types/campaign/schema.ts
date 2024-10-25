

import { boolean, nativeEnum, object, string} from "zod";
import { audienceType } from "../enums";
export const CampaignSchema = object({
    name: string({ required_error: "Name is required" }).min(3, "Name should be at least 3 characters").max(50, "Name can not be more than 50 characters"),
    message: string({ message: "Message is required" }).min(3, "Message should be at least 3 characters"),
    senderId: string(),
    audience:nativeEnum(audienceType),
    sendingOptions: string({message:"Sending options is required"}),
    communicationTemplate: string().optional(),
    scheduled: string().optional(),
    status: boolean().optional(),
})