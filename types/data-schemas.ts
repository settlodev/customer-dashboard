import { isValidPhoneNumber } from "libphonenumber-js";
import {nativeEnum, object, string} from "zod";
import { Gender } from "./enums";


export const LoginSchema = object({
    email: string()
        .min(6, "Please enter a valid email address")
        .email("Please enter a valid email address"),
    password: string({ required_error: "Schema password" }).min(
        6,
        "Please enter a valid password",
    ),
});


export const PhoneVerificationSchema = object({
    phoneNumber: string().optional(),
    code: string().optional()
});

export const EmailVerificationSchema = object({
    email: string().optional(),
    name: string().optional()
});

export const RegisterSchema = object({
    firstName: string({ required_error: "First name is required" }).min(3,"Please enter a valid name",),
    lastName: string({ required_error: "Last name is required" }).min(3,"Please enter a valid name",),
    email: string({ required_error: "Email is required" })
        .min(1, "Please enter a valid email address")
        .email("Please enter a valid email address"),
    phoneNumber: string({ required_error: "Phone number is required" })
        .refine(isValidPhoneNumber, {
            message: "Invalid phone number",
        }),
    password: string({ required_error: "Password is required" }).min(
        6,
        "Please enter a valid password",
    ),
    country:string({required_error:"Country is required"}).uuid("Please select a valid country"),
    gender:nativeEnum(Gender),
    referredByCode: string().optional().nullish(),
});

export const UpdateUserSchema = object({
    firstName: string({ required_error: "First name is required" }).min(3,"Please enter a valid name",),
    lastName: string({ required_error: "Last name is required" }).min(3,"Please enter a valid name",),
    bio: string().optional(),
    email: string().optional(),
    phoneNumber: string().optional(),
    avatar: string().optional(),
    country: string().optional(),
});

export const ResetPasswordSchema = object({
  email: string({ required_error: "Email is required"}).min(6, "Please enter a valid email address").email("Please enter a valid email address"),
});

export const UpdatePasswordSchema = object({
  password: string({ required_error: "Old password is required"}).min(6, "Please enter a valid password"),
});





