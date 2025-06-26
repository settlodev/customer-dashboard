import { subscriptionStatus } from "@/types/enums";
import { UUID } from "crypto"

export interface Warehouses {
    type: any;
    id: UUID;
    name: string;
    phone: string;
    email: string;
    city: string;
    region: string;
    street: string;
    address: string;
    description: string;
    openingTime: string;
    closingTime: string;
    status: boolean;
    canDelete: boolean;
    setting: string;
    business: UUID;
    businessName: string;
    image: string;
    endDate: string;
    locationBusinessTypeName: string;
    subscriptionStatus: subscriptionStatus;
    subscription:UUID;
    isArchived: boolean;
}
