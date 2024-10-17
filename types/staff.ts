import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";
import {boolean, date, nativeEnum, object, preprocess, string} from "zod";
import {isValidPhoneNumber} from "libphonenumber-js";

export const StaffSchema = object({
    firstName: string({ required_error: "First name is required" }).min(
        1,
        "Please enter a valid first name",
    ),
    lastName: string({ required_error: "Last name is required" }).min(
        1,
        "Please enter a valid last name",
    ),
    emailAddress: string()
        .min(1, "Please enter a valid email address")
        .email("Please enter a valid email address")
        .optional(),
    phoneNumber: string({ required_error: "Phone number is required" })
        .refine(isValidPhoneNumber, {
            message: "Invalid phone number",
        })
        .optional(),
    address: preprocess((val) => (val === null ? "" : val), string().optional()),
    staffId: string().optional(),
    gender: nativeEnum(Gender),
    dateOfBirth: preprocess((val) => {
        if (val === null) return undefined;
        if (typeof val === "string" && val.trim() !== "") {
            return new Date(val);
        }

        return val;
    }, date().optional()),
    nationality: preprocess((val) => (val === null ? "" : val),string().optional(),),
    joiningDate: preprocess((val) => {if (val === null) return undefined;if (typeof val === "string" && val.trim() !== "") {return new Date(val);}return val;}, date().optional()),
    jobTitle: string(),
    notes: preprocess((val) => (val === null ? "" : val), string().optional()),
    image: preprocess((val) => (val === null ? "" : val), string().optional()),
    status: boolean(),
    department: string({ message: "Staff department is required" }).uuid(
        "Please select a valid department",
    ),
    salary:string({message:"Salary is required"}).uuid("Please select a valid salary"),
    role: string({ message: "Staff role is required" }).uuid("Please select a valid role")
});

export declare interface Staff {
    id: UUID;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    empNum?: string;
    gender: Gender;
    dateOfBirth?: Date;
    nationality?: string;
    joiningDate: Date;
    jobTitle: string;
    emergencyNumber?: string;
    emergencyName?: string;
    emergencyRelationship?: string;
    address?: string;
    notes?: string;
    department?: UUID;
    branch?: UUID;
    image?: string;
    businessId: UUID;
    canDelete: boolean;
    status: boolean;
    posAccess: boolean;
    dashboardAccess: boolean;
    isArchived: boolean;
    salary:string,
    role:string
}

