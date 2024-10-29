import {object, string,} from "zod";

export const BusinessSchema= object({
    id: string().uuid().optional(),
    name: string().min(2, 'Business must be less than 2 characters').max(50, 'Business can not be more than 50 characters'),
    identificationNumber: string().min(14).max(28).optional(),
    certificateOfIncorporation: string().optional(),
    businessIdentificationDocument: string().optional(),
    businessLicense: string().optional(),
    memarts: string().optional(),
    description: string().min(2, 'Description must be less than 20 characters').max(120, 'Description can not be more than 20 characters'),
    vrn: string().optional(),
    serial: string().optional(),
    uin: string().optional(),
    businessType: string().optional(),
    receiptPrefix: string().optional(),
    receiptSuffix: string().optional(),
    image: string().optional(),
    receiptImage: string().optional(),
    logo: string().optional(),
    notificationPhone: string().optional(),
    notificationEmailAddress: string().optional(),
    website: string().optional(),
    facebook: string().optional(),
    instagram: string().optional(),
    twitter: string().optional(),
    youtube: string().optional(),
    phoneNumber: string().optional(),
    email: string().optional(),
    address: string().optional(),
    country: string().optional(),
})
