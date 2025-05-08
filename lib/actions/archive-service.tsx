"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "../settlo-api-client";
import { getCurrentLocation } from "./business/get-current-business";

interface ArchiveEntityProps {
  ids: string[];
  entityType: 'product' | 'stock' | 'staff' | 'location' | 'supplier' | 'customer' |'stock-intake';
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
    
    // Get location ID if not provided
    const location = locationId ? { id: locationId } : await getCurrentLocation();
    
    if (!location?.id) {
      return { success: false, message: "Location ID is required but not available" };
    }

    // Different API endpoints for different entity types (with location ID)
    try {
      // Map entity types to their API endpoints with location
      switch (entityType) {
        case 'product':
          await apiClient.put(`/api/products/${location.id}/archive`, ids);
          break;
        case 'stock':
          await apiClient.put(`/api/stock-variants/${location.id}/archive`, ids);
          break;
        case 'staff':
          await apiClient.put(`/api/staff/${location.id}/archive`, ids);
          break;
        case 'location':
          // Special case: can't archive current location
          if (ids.includes(location.id)) {
            return { 
              success: false, 
              message: "Cannot archive the currently active location" 
            };
          }
          await apiClient.put(`/api/locations/archive`, ids);
          break;
        case 'supplier':
          await apiClient.put(`/api/suppliers/${location.id}/archive`, ids);
          break;
          case 'stock-intake':
            await apiClient.put(`/api/stock-intakes/${location.id}/archive`, ids);
            break;  
        case 'customer':
          await apiClient.put(`/api/customers/${location.id}/archive`, ids);
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