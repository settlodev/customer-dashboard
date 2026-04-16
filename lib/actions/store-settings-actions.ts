"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";

export interface StoreSettings {
  id: string;
  storeId: string;
  trackInventory: boolean;
  allowNegativeStock: boolean;
  defaultReorderQuantity: number | null;
  allowOutboundTransfers: boolean;
  allowInboundTransfers: boolean;
  requireTransferApproval: boolean;
  transferApprovalThreshold: number | null;
  autoApproveTransferLimit: number | null;
  requireQualityCheck: boolean;
  autoReceiveAfterHours: number | null;
  requireReceivingPhotos: boolean;
  enableBinTracking: boolean;
  enableLotTracking: boolean;
  enableSerialTracking: boolean;
  enableCycleCounting: boolean;
  cycleCountIntervalDays: number | null;
  requireAdjustmentApproval: boolean;
  adjustmentApprovalThreshold: number | null;
  enableBarcodeScanning: boolean;
  notifyLocationOnLowStock: boolean;
  autoRequestStock: boolean;
}

export async function getStoreSettings(storeId: string): Promise<StoreSettings | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/stores/${storeId}/settings`);
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function updateStoreSettings(
  storeId: string,
  settings: Partial<StoreSettings>,
): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/stores/${storeId}/settings`, settings);

    revalidatePath(`/stores/${storeId}`);
    return parseStringify({
      responseType: "success",
      message: "Store settings updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update store settings",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function resetStoreSettings(storeId: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/stores/${storeId}/settings/reset`, {});

    revalidatePath(`/stores/${storeId}`);
    return parseStringify({
      responseType: "success",
      message: "Store settings reset to defaults",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to reset store settings",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
