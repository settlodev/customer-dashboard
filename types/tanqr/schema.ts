import { boolean, number, object, string, z } from "zod";

const ddmmyyyyRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

export const EmploymentDetailsSchema = object({
  nida: string().min(20, "NIDA number is required"),
  sourceOfFundId: number().int(),
  accountProductId: number().int(),
  postalCode: string(),
  occupationId: number().int(),
  contact: string(),
  addressLine1: string(),
  addressCity: string(),
  // professionId: number().int(),
  addressFromDate: string(),
  // idIssueDate: string().regex(ddmmyyyyRegex, {
  //   message: "idIssueDate must be DD/MM/YYYY",
  // }),
  // idExpiryDate: string().regex(ddmmyyyyRegex, {
  //   message: "idExpiryDate must be DD/MM/YYYY",
  // }),
  employmentStartYear: number().int(),
  employmentCategoryId: number().int(),
  // qualificationId: number().int(),
  // sourceOfFundCd: number().int(),
  employerName: string(),
  religionId: number().int(),
  marriageFlag: string(), // e.g. "S", "M"
  // professionCd: string(),
  // profQualificationId: number().int(),
  employAddressLine: string(),
  // idCityOfIssue: string(),
  grossAnnualSalId: number().int(),
  employmentCity: string(),
  // qualificationCode: string(),
  countryOfBirthId: number().int(),
  // profQualificationCode: string(),
  employmentAddress: string(),
  spouseName: string().optional(),
  employed: boolean(),
});

export type EmploymentDetails = z.infer<typeof EmploymentDetailsSchema>;
