import {
  array,
  boolean,
  nativeEnum,
  number,
  object,
  preprocess,
  string,
} from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  AddressType,
  CustomerCreatedFrom,
  CustomerSource,
  Gender,
} from "@/types/enums";

const optionalNumber = preprocess((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "string") {
    const parsed = Number(val);
    return isNaN(parsed) ? undefined : parsed;
  }
  return val;
}, number().nonnegative().optional());

export const CustomerSchema = object({
  firstName: string({ required_error: "First name is required" }).min(
    1,
    "Please enter a valid name",
  ),
  lastName: string({ required_error: "Last name is required" }).min(
    1,
    "Please enter a valid name",
  ),
  gender: nativeEnum(Gender, { required_error: "Gender is required" }),
  phoneNumber: string({ required_error: "Phone number is required" }).refine(
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
  vrn: string().optional(),

  creditLimit: optionalNumber,

  allowNotifications: boolean().optional(),
  notes: string().optional(),

  source: nativeEnum(CustomerSource).optional(),
  createdFrom: nativeEnum(CustomerCreatedFrom).optional(),
  customerGroupId: string()
    .uuid("Please select a valid customer group")
    .optional(),

  active: boolean().optional(),
});

export const CustomerAddressSchema = object({
  addressType: nativeEnum(AddressType, {
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
  preferenceValue: string({
    required_error: "Preference value is required",
  }).min(1, "Value cannot be empty"),
});

export const CustomerGroupSchema = object({
  name: string({ required_error: "Group name is required" }).min(
    1,
    "Group name is required",
  ),
  description: string().optional(),
  active: boolean().optional(),
});

export const BulkGroupChangeSchema = object({
  customerGroupId: string().uuid("Please select a valid group"),
  customerIds: array(string().uuid()).min(
    1,
    "At least one customer is required",
  ),
});
