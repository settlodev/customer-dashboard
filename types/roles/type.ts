import {UUID} from "node:crypto";
import {PrivilegeActionItem} from "@/types/types";

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
