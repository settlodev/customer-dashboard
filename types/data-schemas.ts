import { isValidPhoneNumber } from "libphonenumber-js";
import { object, string } from "zod";

export const LoginSchema = object({
  email: string()
    .min(6, "Please enter a valid email address")
    .email("Please enter a valid email address"),
  password: string({ required_error: "Please enter your password" }).min(
    6,
    "Please enter a valid password",
  ),
});

export const PhoneVerificationSchema = object({
  phoneNumber: string().optional(),
  code: string().optional(),
});

export const EmailVerificationSchema = object({
  email: string().optional(),
  name: string().optional(),
});

export const VerifyEmailCodeSchema = object({
  code: string({ required_error: "Verification code is required" })
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

export const RegisterSchema = object({
  firstName: string({ required_error: "First name is required" }).min(
    3,
    "Please enter a valid name",
  ),
  lastName: string({ required_error: "Last name is required" }).min(
    3,
    "Please enter a valid name",
  ),
  email: string({ required_error: "Email is required" })
    .min(1, "Please enter a valid email address")
    .email("Please enter a valid email address"),
  phoneNumber: string({ required_error: "Phone number is required" }).refine(
    isValidPhoneNumber,
    {
      message: "Invalid phone number",
    },
  ),
  password: string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters"),
  confirmPassword: string({ required_error: "Please confirm your password" }),
  countryId: string({ required_error: "Country is required" }).uuid(
    "Please select a valid country",
  ),
  referredByCode: string().optional().nullish(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const UpdateUserSchema = object({
  firstName: string({ required_error: "First name is required" }).min(
    3,
    "Please enter a valid name",
  ),
  lastName: string({ required_error: "Last name is required" }).min(
    3,
    "Please enter a valid name",
  ),
  bio: string().optional(),
  email: string().optional(),
  phoneNumber: string().optional(),
  avatar: string().optional(),
  country: string().optional(),
});

export const ResetPasswordSchema = object({
  email: string({ required_error: "Email is required" })
    .min(6, "Please enter a valid email address")
    .email("Please enter a valid email address"),
});

export const ResetPasswordVerifyCodeSchema = object({
  userId: string({ required_error: "User ID is required" }),
  code: string({ required_error: "Verification code is required" })
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

export const NewPasswordSchema = object({
  password: string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters"),
});

export const UpdatePasswordSchema = object({
  password: string({ required_error: "Old password is required" }).min(
    6,
    "Please enter a valid password",
  ),
});
