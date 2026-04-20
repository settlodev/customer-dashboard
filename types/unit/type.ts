import { z } from "zod";
import { object, string } from "zod";
import type { UnitType } from "@/types/catalogue/enums";

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  unitType: UnitType;
  /** True when this UoM was seeded by the system — not editable. */
  systemGenerated: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversion {
  id: string;
  fromUnitId: string;
  fromUnitName: string;
  fromUnitAbbreviation: string;
  toUnitId: string;
  toUnitName: string;
  toUnitAbbreviation: string;
  multiplier: number;
  /** True when this conversion was seeded by the system — not editable. */
  systemGenerated: boolean;
}

export interface ConvertResult {
  result: number;
  fromUnit: string;
  toUnit: string;
}

export const UnitOfMeasureSchema = object({
  name: string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  abbreviation: string({ required_error: "Abbreviation is required" })
    .trim()
    .min(1, "Abbreviation is required")
    .max(20, "Abbreviation cannot exceed 20 characters"),
  unitType: string({ required_error: "Pick a unit type" }),
});

export type UnitOfMeasurePayload = z.infer<typeof UnitOfMeasureSchema>;

export const UnitConversionSchema = object({
  fromUnitId: string().uuid("Pick a from-unit"),
  toUnitId: string().uuid("Pick a to-unit"),
  multiplier: string({ required_error: "Multiplier is required" }),
}).refine((v) => v.fromUnitId !== v.toUnitId, {
  path: ["toUnitId"],
  message: "From and to units must differ",
});

export type UnitConversionPayload = z.infer<typeof UnitConversionSchema>;
