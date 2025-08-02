import { Gender } from "@/types/enums";
import { isValidPhoneNumber } from "libphonenumber-js";
import { boolean, date, nativeEnum, object, preprocess, string } from "zod";

export const StaffWarehouseSchema = object({
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
    status: boolean().optional(),
    // department: string({ message: "Staff department is required" }).uuid(
    //   "Please select a valid department"
    // ).nullish().optional(),
    salary: string({ message: "Salary is required" }).uuid(
      "Please select a valid salary"
    ).optional().nullish(),
    warehouseRole: string({ message: "Staff role is required" }).uuid(
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
   
  });