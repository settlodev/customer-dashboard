import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";

export declare interface CustomerResponse {
    id: UUID;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    location: UUID;
    address: string;
    gender: Gender
    allowNotifications: boolean;
    status:boolean;
    canDelete: boolean;
    isArchived:boolean;
}

export declare interface LoginResponse {
    emailAddress: string;
    password: string;
}

