import { UUID } from "crypto"
import { subscriptionStatus } from "../enums"

export interface Location {
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
    endDate: string;
    subscriptionStatus: subscriptionStatus;
    isArchived: boolean;
}
