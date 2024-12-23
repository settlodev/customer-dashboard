import {boolean, object, string,} from "zod";

export const BusinessSchema= object({
    id: string().uuid().optional(),
    name: string().min(2, 'Business must be less than 2 characters').max(50, 'Business can not be more than 50 characters'),
    identificationNumber: string().nullable().optional(),
    certificateOfIncorporation: string().nullable().optional(),
    businessIdentificationDocument: string().nullable().optional(),
    businessLicense: string().nullable().optional(),
    memarts: string().nullable().optional(),
    description: string().min(2, 'Description must be less than 20 characters').max(120, 'Description can not be more than 20 characters').optional(),
    vrn: string().nullable().optional(),
    serial: string().nullable().optional(),
    uin: string().nullable().optional(),
    businessType: string(),
    receiptPrefix: string().nullable().optional(),
    receiptSuffix: string().nullable().optional(),
    image: string().nullable().optional(),
    receiptImage: string().nullable().optional(),
    logo: string().nullable().optional(),
    notificationPhone: string().nullable().optional(),
    notificationEmailAddress: string().optional(),
    website: string().nullish().optional(),
    facebook: string().nullish().optional(),
    instagram: string().nullish().optional(),
    twitter: string().nullish().optional(),
    youtube: string().nullish().optional(),
    country: string(),
    phoneNumber: string().optional(),
    email: string().optional(),
    address: string().optional(),
    vfdRegistrationState: boolean().optional(),
    status: boolean().optional(),

})
