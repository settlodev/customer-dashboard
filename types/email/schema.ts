

import { boolean, object, string} from "zod";
export const EmailSchema = object({
    message: string({ message: "Message is required" }).min(3, "Message should be at least 3 characters"),
    subject: string({ required_error: "Subject is required" }).min(3, "Subject should be at least 3 characters").max(50, "Subject can not be more than 50 characters"),
    template: string().optional(),
    from:string(),
    receipt: string({message:"Receipt is required"}),
    sendingOptions: string({message:"Sending options is required"}),
    scheduled: string().optional(),
    status: boolean().optional(),
})