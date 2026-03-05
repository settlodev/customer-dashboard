import { UUID } from "crypto";
import { discountType } from "../enums";

export declare interface Discount {
  id: UUID;
  name: string;
  discountValue: number;
  validFrom: string;
  validTo: string;
  discountCode: string;
  minimumSpend: number;
  discountType: discountType;
  usageLimit: string;
  activations: number;
  department: string;
  product: string;
  location: string;
  customer: string;
  category: string;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}
