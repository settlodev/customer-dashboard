import { boolean, nativeEnum, number, object, string, enum as zenum, array, preprocess } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Gender } from "@/types/enums";

const optionalNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().nonnegative().optional(),
);

export const CustomerSchema = object({
  firstName: string({ required_error: "Customer first name is required" }).min(
    1,
    "Please enter a valid name",
  ),
  lastName: string({ required_error: "Customer last name is required" }).min(
    1,
    "Please enter a valid name",
  ),
  gender: nativeEnum(Gender, { required_error: "Gender is required" }),
  phoneNumber: string({ message: "Customer phone number is required" }).refine(
    isValidPhoneNumber,
    { message: "Invalid phone number" },
  ),
  email: string()
    .email("Please enter a valid email address")
    .optional()
    .or(string().length(0))
    .transform((val) => (val === "" ? undefined : val)),
  dateOfBirth: string().optional(),
  idType: string().optional(),
  idNumber: string().optional(),
  tinNumber: string().optional(),
  creditLimit: optionalNumber,
  vrn: string().optional(),
  allowNotifications: boolean().optional(),
  noShowCount: optionalNumber,
  notes: string().optional(),
  seatingPreference: string().optional(),
  loyaltyPoints: optionalNumber,
  source: zenum(["POS", "ONLINE", "GOOGLE", "INSTAGRAM", "REFERRAL", "WALK_IN"]).optional(),
  createdFrom: zenum(["POS", "MOBILE_APP", "WEBSITE", "RESERVATION"]).optional(),
  customerGroup: string().uuid("Please select a valid customer group").optional(),
  status: boolean().optional(),
});

export const CustomerAddressSchema = object({
  addressType: zenum(["HOME", "WORK", "OTHER"], {
    required_error: "Address type is required",
  }),
  addressLine: string({ required_error: "Address is required" }).min(
    1,
    "Address cannot be empty",
  ),
});

export const CustomerPreferenceSchema = object({
  preferenceKey: string({ required_error: "Preference key is required" }).min(
    1,
    "Key cannot be empty",
  ),
  preferenceValue: string({ required_error: "Preference value is required" }).min(
    1,
    "Value cannot be empty",
  ),
});

export const CustomerGroupSchema = object({
  name: string({ required_error: "Group name is required" }).min(
    1,
    "Group name is required",
  ),
});

export const CustomersGroupChangeSchema = object({
  customerGroupId: string().uuid("Please select a valid group"),
  customerIds: array(string().uuid()).min(1, "At least one customer is required"),
});
