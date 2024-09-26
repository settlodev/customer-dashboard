import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";

export declare interface Customer {
    id: UUID;
    name: string;
    emailAddress: string;
    phoneNumber: string;
    location: UUID;
    address: string;
    gender: Gender;
    nationality: string;
    dateOfBirth: Date;
    allowNotifications: boolean;
    notes: string;
    points: 0;
    lastVisit: Date;
    totalSpend: number;
    canDelete: boolean;
}

export declare interface LoginResponse {
    emailAddress: string;
    password: string;
}
