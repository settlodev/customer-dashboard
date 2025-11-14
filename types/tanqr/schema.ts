import { boolean, number, object, string, z } from "zod";

export const EmploymentDetailsSchema = object({
  identificationNumber: string().min(20, "NIDA number is required"),
  sourceOfFundId: number().int(),
  accountProductId: number().int(),
  postalCode: string(),
  occupationId: number().int(),
  contact: string(),
  addressLine1: string(),
  addressCity: string(),
  addressFromDate: string(),
  employmentStartYear: number().int(),
  employmentCategoryId: number().int(),
  employerName: string(),
  religionId: number().int(),
  marriageFlag: string(), // e.g. "S", "M"
  employAddressLine: string(),
  grossAnnualSalId: number().int(),
  employmentCity: string(),
  countryOfBirthId: number().int(),
  employmentAddress: string(),
  spouseName: string().optional(),
  employed: boolean(),
});
