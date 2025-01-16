import { UUID } from "node:crypto";
import { Gender } from "@/types/enums";
import {
  boolean,
  date,
  nativeEnum,
  object,
  preprocess,
  string,
} from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const StaffSchema = object({
  firstName: string({ required_error: "Staff first name is required" }).min(
    1,
    "Please enter a valid first name"
  ),
  lastName: string({ required_error: "Staff last name is required" }).min(
      1,
      "Please enter a valid last name"
  ),
  color: preprocess((val) => (val === null ? "" : val), string().optional()),
  email: string()
    .min(1, "Please enter a valid email address")
    .email("Please enter a valid email address")
    .optional()
    .nullish(),
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
  ).optional().nullish(),
  role: string({ message: "Staff role is required" }).uuid(
    "Please select a valid role"
  ),
  address: preprocess((val) => (val === null ? "" : val), string().optional()),
  employeeNumber: string().optional().nullish(),
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
  posAccess: boolean().optional(),
  dashboardAccess: boolean().optional(),
});

export declare interface Staff {
  id: UUID;
  firstName: string;
  lastName: string;
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

export declare interface StaffSummaryReport{
  staffReports:staffReports[]
} 

export declare interface staffReports {
  id: UUID;
  name: string;
  image: string;
  totalOrdersCompleted: number;
  totalItemsSold: number;
  totalStockIntakePerformed: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalGrossProfit: number;
}