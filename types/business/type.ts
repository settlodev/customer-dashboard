import {UUID} from "node:crypto";

export  interface Business {
    "id": UUID,
    "user": UUID
    "name": string
    "logo": string
    "image":string
    "storeName":string
    "slug":string
    "description": string
    "businessType": string
    "identificationNumber":string
    "certificateOfIncorporation": string
    "businessIdentificationDocument": string
    "businessLicense": string
    "memarts": string
    "vfdRegistrationStatus": boolean
    "vrn":string
    "serial":string
    "uin":string
    "tax":number
    "notificationPhone": string
    "notificationEmailAddress": string
    "prefix": string
    "receiptPrefix": string
    "receiptSuffix": string
    "receiptImage": string
    "website": string
    "facebook": string
    "twitter": string
    "instagram": string
    "linkedin": string
    "youtube":string
    "country":string
    "status": boolean
    "canDelete": boolean
    "isArchived": boolean
}
