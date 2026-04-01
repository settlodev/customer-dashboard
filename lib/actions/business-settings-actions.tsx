"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface BusinessSettings {
  id: string;
  accountId: string;
  businessId: string;

  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  logoSquareUrl?: string;
  logoWideUrl?: string;
  faviconUrl?: string;
  bannerImageUrl?: string;
  fontFamily?: string;
  shareImageUrl?: string;

  // Business Information
  registrationNumber?: string;
  taxIdentificationNumber?: string;
  vatRegistrationNumber?: string;
  efdSerialNumber?: string;
  uniqueIdentificationNumber?: string;
  businessLicenseNumber?: string;
  industry?: string;
  businessType?: string;
  establishedYear?: number;

  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;

  // Operational Defaults
  defaultCurrency?: string;
  defaultLanguage?: string;
  defaultTimezone?: string;
  defaultPricesIncludeTax?: boolean;
  defaultTaxRate?: number;
  defaultTaxLabel?: string;

  // Inventory
  enableInventoryTracking?: boolean;
  enableLowStockAlerts?: boolean;
  defaultLowStockThreshold?: number;
  allowNegativeStock?: boolean;
  trackBatchNumbers?: boolean;
  trackExpiryDates?: boolean;

  // Customer
  enableCustomerAccounts?: boolean;
  enableLoyaltyProgram?: boolean;
  loyaltyPointsPerUnit?: number;
  loyaltyPointValue?: number;
  minPointsForRedemption?: number;
  enableCustomerReviews?: boolean;

  // Staff Points
  enableStaffPoints?: boolean;
  staffPointsPerUnit?: number;
  staffPointValue?: number;
  minStaffPointsForRedemption?: number;
  defaultStaffPointsRecipient?: string;

  // Orders
  enableOnlineOrdering?: boolean;
  enableDelivery?: boolean;
  defaultDeliveryFee?: number;
  minimumDeliveryOrderAmount?: number;
  enablePickup?: boolean;
  enableDineIn?: boolean;
  defaultPrepTimeMinutes?: number;
  acceptScheduledOrders?: boolean;
  maxScheduleDaysAhead?: number;

  // Payments
  defaultPaymentInstructions?: string;
  enableSplitPayments?: boolean;
  enablePartialPayments?: boolean;

  // Notifications
  notificationEmail?: string;
  notificationPhone?: string;
  sendConsolidatedDailyReport?: boolean;
  sendConsolidatedWeeklyReport?: boolean;
  sendConsolidatedMonthlyReport?: boolean;

  // Staff Management
  enableShiftManagement?: boolean;
  enableTimeTracking?: boolean;
  enablePerformanceTracking?: boolean;
  requireApprovalForVoids?: boolean;
  requireApprovalForDiscounts?: boolean;
  discountApprovalThreshold?: number;

  // Procurement
  requirePurchaseRequisitionApproval?: boolean;
  supplierPerformanceTrackingEnabled?: boolean;
  landedCostTrackingEnabled?: boolean;
  locationToLocationTransferEnabled?: boolean;

  // Digital Presence
  enableDigitalMenu?: boolean;
  digitalMenuDomain?: string;
  enableDigitalMenuOrdering?: boolean;
  showPricesOnDigitalMenu?: boolean;
  showStockOnDigitalMenu?: boolean;
  digitalMenuWelcomeMessage?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  returnPolicy?: string;

  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // Virtual EFD
  enableVirtualEfd?: boolean;
  efdStatus?: string;

  [key: string]: unknown;
}

export const getBusinessSettings = async (businessId: string): Promise<BusinessSettings> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/businesses/${businessId}/settings`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const updateBusinessSettings = async (
  businessId: string,
  settings: Partial<BusinessSettings>,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/businesses/${businessId}/settings`, settings);
    revalidatePath("/business");
    return { responseType: "success", message: "Business settings updated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update business settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const resetBusinessSettings = async (businessId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/businesses/${businessId}/settings/reset`, {});
    revalidatePath("/business");
    return { responseType: "success", message: "Business settings reset to defaults" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reset business settings",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
