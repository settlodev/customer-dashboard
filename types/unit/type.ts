import type { UnitType } from "@/types/catalogue/enums";

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  unitType: UnitType;
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
}

export interface ConvertResult {
  result: number;
  fromUnit: string;
  toUnit: string;
}
