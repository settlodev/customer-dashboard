import {UUID} from "node:crypto";
import {Location} from "@/types/location/type";

export declare interface Business {
    id: UUID,
    prefix: string,
    name: string,
    tax: number,
    identificationNumber: string,
    vrn: string,
    serial: string,
    uin: string,
    receiptPrefix: string,
    receiptSuffix: string,
    businessType: string,
    businessTypeName: string,
    slug: string,
    businessAccountNumber: string,
    image: string,
    receiptImage: string,
    logo: string,
    primaryColor: string | null,
    secondaryColor: string | null,
    bannerImageUrl: string | null,
    faviconUrl: string | null,
    fontFamily: string | null,
    metaTitle: string | null,
    metaDescription: string | null,
    shareImageUrl: string | null,
    facebook: string,
    twitter: string,
    instagram: string,
    linkedin: string,
    youtube: string,
    tiktok: string,
    certificateOfIncorporation: string,
    businessIdentificationDocument: string,
    businessLicense: string,
    memarts: string,
    notificationPhone: string,
    notificationEmailAddress: string,
    description: string,
    vfdRegistrationState: boolean,
    website: string,
    canDelete: boolean,
    status: boolean,
    user: UUID,
    country: UUID,
    countryName: string,
    isArchived: boolean,
    totalLocations: number,
    allLocations: Location[]|[]
}

export declare interface MinimalBusiness {
    id: UUID;
    name: string;
    prefix: string;
    businessType: string;
    logo: string | null,
    status: boolean,
    user: UUID,
    country: UUID,
    countryName: string,
    isArchived: boolean,
    totalLocations: number,
}

export declare interface BusinessWithLocationType {
    business: Business,
    locations: Location[]|[]
}
