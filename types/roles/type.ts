import {UUID} from "node:crypto";

export declare interface Role {
    id: UUID;
    name: string;
    description: string;
    business: UUID;
    canDelete: boolean;
    status: boolean;
    posAccess: boolean;
    dashboardAccess: boolean;
}
