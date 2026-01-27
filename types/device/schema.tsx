import { boolean, date, nativeEnum, number, object, string } from "zod";
import { discountType } from "../enums";

export const DeviceSchema = object({
  deviceCustomName: string({
    required_error: "Name for device is required",
  }).min(3, "Name for device is required"),
  department: string({
    required_error: "Department to be linked to location is required",
  }),
});
