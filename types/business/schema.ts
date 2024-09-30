import {boolean, object, string} from "zod";

export const BusinessSchema = object({
    name: string().min(2),
    image: string(),
    receiptImage: string(),
    logo: string(),
    facebook: string(),
    twitter: string(),
    instagram: string(),
    linkedin: string(),
    youtube: string(),
    notificationPhone: string(),
    notificationEmailAddress: string(),
    description: string(),
    website: string(),
    canDelete: boolean(),
    status: boolean(),
    businessType: string().uuid(),
    user: string().uuid(),
    country: string().uuid(),
    isArchived: boolean()
})
