/**
 * Letterhead block embedded on every shareable inventory document
 * (purchase requisitions, GRNs, RFQs, supplier returns, LPOs).
 *
 * Mirrors {@code LocationLetterheadResponse} in the Inventory Service.
 * The backend resolves location-first / business-fallback for letterhead
 * fields, and falls back to the whitelabel app for missing brand colors.
 * Tax IDs are always business-level.
 */
export interface LocationLetterhead {
  locationId: string | null;
  businessId: string | null;
  letterhead: LetterheadBlock | null;
  taxIds: TaxIdsBlock | null;
  brand: BrandBlock | null;
}

export interface LetterheadBlock {
  businessName: string | null;
  locationName: string | null;
  addressLine: string | null;
  street: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryName: string | null;
  countryCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
}

export interface TaxIdsBlock {
  tin: string | null;
  vrn: string | null;
  urn: string | null;
  businessLicenseNumber: string | null;
  companyRegistrationNumber: string | null;
  efdSerialNumber: string | null;
  efdStatus: string | null;
}

export interface BrandBlock {
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  logoSquareUrl: string | null;
  logoWideUrl: string | null;
  faviconUrl: string | null;
  bannerImageUrl: string | null;
  shareImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}
