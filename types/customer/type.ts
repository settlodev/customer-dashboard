
import {Gender} from "@/types/enums";
import {UUID} from "node:crypto";


export declare interface Customer {
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

