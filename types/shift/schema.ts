import { boolean, object, string } from "zod";

export const ShiftSchema = object({
    name: string({ required_error: "Name of shift is required" }).min(3, "Name should be at least 3 characters").max(50, "Name can not be more than 50 characters"),
    startTime: string({ required_error: "Start time is required" }),
    endTime: string({ required_error: "End time is required" }),
    // location: string({ required_error: "Location is required" }),
    status: boolean().optional(),
    department: string().optional(),

    // staff: string({ required_error: "Staff is required" }),
})