import type { DestinationType } from "@/types/catalogue/enums";

export type ModificationCategory =
  | "DAMAGE"
  | "RECOUNT"
  | "THEFT"
  | "EXPIRY"
  | "WRITE_OFF"
  | "PRODUCTION_LOSS"
  | "CORRECTION"
  | "OTHER";

export interface StockModification {
  id: string;
  modificationNumber: string;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  category: ModificationCategory;
  reason: string;
  performedBy: string;
  performedByName: string | null;
  modificationDate: string;
  notes: string | null;
  items: StockModificationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockModificationItem {
  id: string;
  stockVariantId: string;
  variantName: string;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  unitCost: number | null;
  notes: string | null;
}

export const MODIFICATION_CATEGORY_OPTIONS: { value: ModificationCategory; label: string }[] = [
  { value: "DAMAGE", label: "Damage" },
  { value: "RECOUNT", label: "Recount" },
  { value: "THEFT", label: "Theft" },
  { value: "EXPIRY", label: "Expiry" },
  { value: "WRITE_OFF", label: "Write Off" },
  { value: "PRODUCTION_LOSS", label: "Production Loss" },
  { value: "CORRECTION", label: "Correction" },
  { value: "OTHER", label: "Other" },
];
