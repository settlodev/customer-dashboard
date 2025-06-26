import { boolean, number, object, string } from "zod";

export const LocationSettingsSchema = object({
   minimumSettlementAmount:string({required_error: "Minimum settlement amount is required"}).min(1,"Minimum settlement amount is required"),
   systemPasscode:string({required_error: "System pass code is required"}).min(4,"System pass code is required"),
   reportsPasscode:string({required_error: "Report pass code is required"}).min(4,"Report pass code is required"),
   trackInventory:boolean().optional(),
   ecommerceEnabled:boolean().optional(),
   isDefault:boolean().optional(),
   enableNotifications:boolean().optional(),
   useRecipe:boolean().optional(),
   useDepartments:boolean().optional(),
   useCustomPrice:boolean().optional(),
   useWarehouse:boolean().optional(),
   useShifts:boolean().optional(),
   isActive:boolean().optional(),
   useKds:boolean().optional(),
   enableOrdersPrintsCount:boolean().optional(),
   showPosProductQuantity:boolean().optional(),
   showPosProductPrice:boolean().optional(),
   status:boolean().optional(),
})