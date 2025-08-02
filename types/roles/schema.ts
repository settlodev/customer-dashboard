import {array, boolean, object, string} from "zod";

export const RoleSchema = object({
    name: string({ required_error: "Role name is required" }).min(1, "Please enter a valid role name"),
    status: boolean(),
    description: string().optional(),
    privilegeActionsIds: array(string()).optional()
});

export const WarehouseRoleSchema = object({
    name: string({ required_error: "Role name is required" }).min(1, "Please enter a valid role name"),
    description: string().optional(),
    privilegeActionsIds: array(string()).optional()
});