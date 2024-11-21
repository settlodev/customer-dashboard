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
        number({message:"Quantity is required"}).nonnegative({message:"Quantity can not be negative"}).gt(0,{message:"Quantity can not be zero"})
    ),
    value: preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Value/Amount of inventory is required"}).nonnegative({message:"Value can not be negative"}).gt(0,{message:"Value can not be zero"})
    ),
    staff:string({message:"Please select a staff"}).uuid(),
    status: boolean().optional(),
    reason:nativeEnum(reasonForStockModification),
    comment:string().optional()
});
