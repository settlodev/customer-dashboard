import {boolean, date, nativeEnum, object, preprocess, string} from "zod";
import {Gender} from "@/types/enums";
import { isValidPhoneNumber } from "libphonenumber-js";

export const LoginSchema = object({
    email: string()
        .min(6, "Please enter a valid email address")
        .email("Please enter a valid email address"),
    password: string({ required_error: "Customer password" }).min(
        6,
        "Please enter a valid password",
    ),
});

export const CustomerSchema = object({
    name: string({ required_error: "Customer name is required" }).min(
        1,
        "Please enter a valid name",
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
        string().optional(),
    ),
    notes: preprocess((val) => (val === null ? "" : val), string().optional()),
    allowNotifications: boolean(),
    location: string({ message: "Customer location is required" }).uuid(
        "Please select a valid locations",
    ),
});



