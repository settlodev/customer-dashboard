"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";

export interface WarehouseSettings {
  id: string;
  warehouseId: string;
  warehouseName: string;
  // Inventory
  trackInventory: boolean;
  allowNegativeStock: boolean;
  defaultReorderQuantity: number | null;
  // Transfers
  allowOutboundTransfers: boolean;
  allowInboundTransfers: boolean;
  requireTransferApproval: boolean;
  transferApprovalThreshold: number | null;
  autoApproveTransferLimit: number | null;
  // Receiving
  requireQualityCheck: boolean;
  autoReceiveAfterHours: number | null;
  requireReceivingPhotos: boolean;
  // Storage
  enableBinTracking: boolean;
  enableLotTracking: boolean;
  enableSerialTracking: boolean;
  // Counting
  enableCycleCounting: boolean;
  cycleCountIntervalDays: number | null;
  requireAdjustmentApproval: boolean;
  adjustmentApprovalThreshold: number | null;
  // Operational
  enableBarcodeScanning: boolean;
  notifyOutsideHours: boolean;
  // Operating hours
  operatingHours: Array<{
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    closed: boolean;
  }>;
}

export async function getWarehouseSettings(warehouseId: string): Promise<WarehouseSettings | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/warehouses/${warehouseId}/settings`);
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function updateWarehouseSettings(
  warehouseId: string,
  settings: Partial<WarehouseSettings>,
): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/warehouses/${warehouseId}/settings`, settings);

    revalidatePath(`/warehouse-profile`);
    return parseStringify({
      responseType: "success",
      message: "Warehouse settings updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update settings",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function resetWarehouseSettings(warehouseId: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/warehouses/${warehouseId}/settings/reset`, {});

    revalidatePath(`/warehouse-profile`);
    return parseStringify({
      responseType: "success",
      message: "Warehouse settings reset to defaults",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to reset settings",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
