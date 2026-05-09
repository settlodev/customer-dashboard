/**
 * Tax type — owned by the Accounting Service. The inventory service mirrors
 * the rows it cares about into `tax_type_references` so that each product
 * variant can reference one by id (`productVariant.taxTypeId`).
 *
 * Mirrors the shape of {@code TaxTypeResponse} in the Accounting Service.
 */
export interface TaxType {
  id: string;
  businessId: string;
  /** TRA-aligned code. "A" = standard rate (VAT 18%), "E" = exempt, etc. */
  code: string;
  /** Display name, e.g. "Standard Rate (VAT 18%)". */
  name: string;
  /** Percentage, e.g. 18.0000. */
  ratePercent: number;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  systemSeeded: boolean;
  createdAt: string;
  updatedAt: string;
}
