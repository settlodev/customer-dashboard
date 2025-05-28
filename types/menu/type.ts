import { BusinessType } from "../enums"

export interface LocationDetails{
    businessName: string,
    locationName: string,
    slug: string,
    tagline: string,
    businessLogo: string,
    businessPhone: string,
    businessEmailAddress: string,
    locationAddress: string,
    locationOpeningHours: string,
    locationClosingHours: string,
    locationSocials: {
        facebook: string,
        twitter: string,
        instagram: string
        youtube: string
        linkedin: string
        website: string
        tiktok: string
    },
    businessType: BusinessType
    }
