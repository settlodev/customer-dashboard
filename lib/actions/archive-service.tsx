"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";

interface ArchiveEntityProps {
  ids: string[];
  entityType: 'product' | 'stock' | 'staff' |'stock-intake';
  locationId?: string;
}


export async function archiveEntity({ 
  ids, 
  entityType,
  locationId
}: ArchiveEntityProps): Promise<{ success: boolean; message: string }> {

    
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No items selected for archiving" };
    }

    const apiClient = new ApiClient();
    
   
const location = locationId ? { id: locationId } : await getCurrentLocation();

const actualLocationId = locationId || location?.id;
 

if (!actualLocationId) {
  return { success: false, message: "Location ID is required but not available" };
}


    try {
      
      switch (entityType) {
        case 'product':
          await apiClient.put(`/api/products/${actualLocationId}/archive`, ids);
          
          break;
        case 'stock':
          const response = await apiClient.put(`/api/stock-variants/${actualLocationId}/archive`, ids);
          console.log("Archive response:", response);
          break;
        case 'staff':
          await apiClient.put(`/api/staff/${actualLocationId}/archive`, ids);
         
          break;
         
          case 'stock-intake':
            await apiClient.put(`/api/stock-intakes/${actualLocationId}/archive`, ids);
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
      product: "/products",
      stock: "/stock-variants",
      staff: "/staff",
      location: "/locations",
      supplier: "/suppliers",
      customer: "/customers",
      stockIntake: "/stock-intakes"
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