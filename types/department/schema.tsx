import { boolean, object, string } from "zod";

export const DepartmentSchema = object({
    name: string({ required_error: "Department name is required" }).min(3,"Please enter a valid name",),
    color:string().optional(),
    image:string().optional(),
    notificationToken:string().optional(),
    status: boolean().optional(),
}) 