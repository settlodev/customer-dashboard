import { UUID } from "crypto";

export declare interface Reservation {
    id: UUID;
    name: string;
    email: string;
    phoneNumber: string;
    numberOfPeople: number;
    date: string;
    time: string;
    startDate: string;
    endDate: string;
    location: string;
    business: string;
    customer: string;
    product: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}