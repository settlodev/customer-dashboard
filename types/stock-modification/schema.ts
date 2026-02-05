import {boolean, object, string, preprocess, number, nativeEnum} from "zod";
import { reasonForStockModification } from "../enums";

export const StockModificationSchema = object({
    stockVariant:string({message:"Please select a stock variant"}).uuid(),
    quantity: preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Quantity is required"})
    ),
    staff:string({message:"Please select a staff"}).uuid(),
    status: boolean().optional(),
    reason:nativeEnum(reasonForStockModification),
    comment:string().optional()
});
