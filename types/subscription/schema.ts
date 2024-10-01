import { number, object, string } from "zod";
export const SubscriptionSchema = object({
    amount: number(),
    discount: number(),
    startDate: string(),
    endDate: string(),
    packageName: string(),
    packageCode: string(),
})