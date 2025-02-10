import { UUID } from "crypto";

export declare interface Department {
    id: UUID;
    name: string;
    color: string;
    image: string;
    notificationToken: string;
    location:string
    business: string;
    isArchived: boolean;
    status: boolean;
    canDelete: boolean;
}

export declare interface Report {
    startDate: string;
    endDate: string;
    name: string;
    image: string | null;
    totalItemsSold: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalGrossProfit: number;
};