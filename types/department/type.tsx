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
    soldItems: {
        name: string;
        productName: string;
        variantName: string;
        categoryName: string;
        imageUrl: string | null;
        quantity: number;
        price: number;
        cost: number;
        grossProfit: number;
        latestSoldDate: string;
        earliestSoldDate: string;
    }[];
    startDate: string;
    endDate: string;
    name: string;
    image: string | null;
    totalItemsSold: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalGrossProfit: number;
}