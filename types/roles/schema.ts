import { array, nativeEnum, object, preprocess, string } from "zod";
import { RoleScope } from "./type";

export const RoleSchema = object({
  name: string({ required_error: "Role name is required" }).min(2, "Name must be at least 2 characters").max(100),
  description: preprocess((val) => (val === null || val === "" ? undefined : val), string().max(500).optional()),
  scope: nativeEnum(RoleScope, { required_error: "Scope is required" }),
  scopeId: preprocess((val) => (val === null || val === "" ? undefined : val), string().uuid().optional()),
  permissionKeys: array(string()).optional(),
});
