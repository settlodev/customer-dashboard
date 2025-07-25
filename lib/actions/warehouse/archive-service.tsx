"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { getCurrentWarehouse } from "./current-warehouse-action";
import { getCurrentBusiness } from "../business/get-current-business";



interface warehouseArchiveEntityProps {
  ids: string[];
  entityType: 'stock' | 'stock-intake' | 'supplier';
  warehouseId?: string;
}

export async function WarehouseArchiveEntity({ 
  ids, 
  entityType,
  warehouseId
}: warehouseArchiveEntityProps): Promise<{ success: boolean; message: string }> {

  // console.log('Starting archiveEntity with ids:', ids);
  // console.log('Starting archiveEntity with entityType:', entityType);
  // console.log('Starting archiveEntity with warehouseId:', warehouseId);
    
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No items selected for archiving" };
    }

    const apiClient = new ApiClient();
    
   
const warehouse = warehouseId ? { id: warehouseId } : await getCurrentWarehouse();

const actualWarehouseId = warehouseId || warehouse?.id;

const business = await getCurrentBusiness();

const payload = {
  archiveStatus: true,
  ids: ids,
}
 

if (!actualWarehouseId) {
  return { success: false, message: "Warehouse is required but not available" };
}

    try {
      
      switch (entityType) {
       
        case 'stock':
          await apiClient.put(`/api/stock-variants/${actualWarehouseId}/all-with-warehouse/archive`, ids);
          break;
         
          case 'stock-intake':
           await apiClient.put(`/api/stock-intakes/${actualWarehouseId}/all-with-warehouse/archive`, ids);
            break; 
            
          case 'supplier':
            await apiClient.put(`/api/suppliers/${business?.id}/update-archival-status`, payload);
            break;
       
        default:
          return { success: false, message: `Unsupported entity type: ${entityType}` };
      }
    } catch (error) {
      console.error(`API error archiving ${entityType}:`, error);
      return { 
        success: false, 
        message: `Failed to archive ${entityType}(s): ${(error as Error).message || "API error"}` 
      };
    }

    // Revalidate the appropriate path
    const paths: Record<string, string> = {
      stock: "/warehouse-stock-variants",
      supplier: "/warehouse-suppliers",
      stockIntake: "/warehouse-stock-intakes"
    };
    
    if (paths[entityType]) {
      revalidatePath(paths[entityType]);
    }

    return { 
      success: true, 
      message: `${ids.length} ${entityType}(s) archived successfully` 
    };
  } catch (error) {
    console.error(`Error archiving ${entityType}:`, error);
    return { 
      success: false, 
      message: `Failed to archive ${entityType}(s): ${(error as Error).message || "Unknown error"}` 
    };
  }
}