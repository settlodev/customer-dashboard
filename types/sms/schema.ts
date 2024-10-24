

import { boolean, object, string} from "zod";
export const SMSSchema = object({
    message: string({ message: "Message is required" }).min(3, "Message should be at least 3 characters").max(140, "Message can not be more than 140 characters"),
    senderId: string(),
    template: string().optional(),
    receipt: string({message:"Receipt is required"}),
    sendingOptions: string({message:"Sending options is required"}),
    scheduled: string().optional(),
    status: boolean().optional(),
})