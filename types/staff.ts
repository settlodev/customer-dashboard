import { UUID } from "node:crypto";
import { Gender } from "@/types/enums";
import {
  boolean,
  date,
  nativeEnum,
  number,
  object,
  preprocess,
  string,
} from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const StaffSchema = object({
  name: string({ required_error: "Staff full name is required" }).min(
    1,
    "Please enter a valid first name"
  ),
 
  color: preprocess((val) => (val === null ? "" : val), string().optional()),
  email: string()
    .min(1, "Please enter a valid email address")
    .email("Please enter a valid email address")
    .optional(),
  phone: string({ required_error: "Phone number is required" }).refine(
    isValidPhoneNumber,
    {
      message: "Invalid phone number",
    }
  ),
  image: preprocess((val) => (val === null ? "" : val), string().optional()),
  status: boolean(),
  department: string({ message: "Staff department is required" }).uuid(
    "Please select a valid department"
  ),
  salary: string({ message: "Salary is required" }).uuid(
    "Please select a valid salary"
  ).optional(),
  role: string({ message: "Staff role is required" }).uuid(
    "Please select a valid role"
  ),

  address: preprocess((val) => (val === null ? "" : val), string().optional()),
  employeeNumber: string().optional(),
  gender: nativeEnum(Gender),
  dateOfBirth: preprocess((val) => {
    if (val === null) return undefined;
    if (typeof val === "string" && val.trim() !== "") {
      return new Date(val);
    }

    return val;
  }, date().optional()),
  nationality: preprocess(
    (val) => (val === null ? "" : val),
    string().optional()
  ),
  joiningDate: preprocess((val) => {
    if (val === null) return undefined;
    if (typeof val === "string" && val.trim() !== "") {
      return new Date(val);
    }
    return val;
  }, date().optional()),
  jobTitle: string({message:"Job title is required"}).min(3, "Please enter a valid job title"),

  emergencyName: preprocess((val) => (val === null ? "" : val), string().optional()),
  emergencyNumber: preprocess((val) => (val === null ? "" : val), string().optional()),
  emergencyRelationship: preprocess((val) => (val === null ? "" : val), string().optional()),
  notes: preprocess((val) => (val === null ? "" : val), string().optional()),
  posAccess: boolean(),
  dashboardAccess: boolean(),
});

export declare interface Staff {
  id: UUID;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  passCode?: number;
  color?: string;
  salary: string;
  role: string;
  gender: Gender;
  jobTitle: string;
  business: string;
  location: string;
  employeeNumber?: string;
  department?: UUID;
  address?: string;
  notes?: string;
  emergencyNumber?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  posAccess: boolean;
  dashboardAccess: boolean;
  canDelete: boolean;
  isArchived: boolean;
  status: boolean;

  dateOfBirth?: Date;
  nationality?: string;
  joiningDate: Date;

  
}
