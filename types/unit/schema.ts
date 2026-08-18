import { object, string } from "zod";

export const UnitSchema = object({
  name: string({ required_error: "Unit name is required" }).min(1, "Unit name is required"),
  abbreviation: string({ required_error: "Abbreviation is required" }).min(1, "Abbreviation is required"),
  unitType: string({ required_error: "Unit type is required" }),
});
