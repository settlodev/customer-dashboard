import {UUID} from "node:crypto";
import {PrivilegeActionItem, WarehousePrivilegeActionItem} from "@/types/types";

export declare interface Role {
    id: UUID;
    name: string;
    description: string;
    business: UUID;
    canDelete: boolean;
    status: boolean;
    posAccess: boolean;
    dashboardAccess: boolean;
    privilegeActions: PrivilegeActionItem[];
}

export declare interface WarehouseRole {
    id: UUID;
    name: string;
    description: string;
    business: UUID;
    canDelete: boolean;
    status: boolean;
    posAccess: boolean;
    dashboardAccess: boolean;
    warehousePrivilegeActions: WarehousePrivilegeActionItem[];
}
