import {boolean, object, string, array, preprocess, number} from "zod";

export const StockIntakeSchema = object({
    stock:string({message:"Please select an inventory"}).uuid(),
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
    batchExpiryDate: string({ required_error: "Batch expiry date is required" }).optional(),
    orderDate: string({ required_error: "Order date is required" }),
    deliveryDate: string({ required_error: "Delivery date is required" }),
    status: boolean().optional(),
    supplier: string({message:"Please select a supplier"}).uuid().optional(),
    staff: string({message:"Please select a staff"}).uuid().optional(),
});
