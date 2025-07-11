import {boolean, object, string,preprocess, number} from "zod";

export const StockRequestSchema = object({
    fromLocation:string({message:"Please select a business location "}).uuid(),
    toWarehouse:string({message:"Please select a warehouse where stock will be requested"}).uuid(),
    locationStaffRequested:string({message:"Please select a staff"}).uuid(),
    warehouseStockVariant:string({message:"Please select a stock variant"}).uuid(),
    quantity: preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Quantity is required"}).nonnegative({message:"Quantity can not be negative"}).gt(0,{message:"Quantity can not be zero"})
    ),
    status: boolean().optional(),
    comment:string().optional()
});
