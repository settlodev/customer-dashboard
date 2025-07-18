import {boolean, object, string, preprocess, number} from "zod";

export const StockIntakeSchema = object({
    stockVariant:string({message:"Please select stock item"}).uuid(),
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
        number({message:"Value of inventory is required"}).nonnegative({message:"Value can not be negative"}).gt(0,{message:"Value can not be zero"})
    ),
    batchExpiryDate: string({ required_error: "Batch expiry date is required" }).optional(),
    orderDate: string({ required_error: "Order date is required" }),
    deliveryDate: string({ required_error: "Delivery date is required" }),
    status: boolean().optional(),
    supplier: string({message:"Please select a supplier"}).uuid().optional(),
    staff: string({message:"Please select a staff"}).uuid(),
    purchasePaidAmount: number().optional(),
});

export const UpdatedStockIntakeSchema = object({
    value:number().min(0, { message: "Value must be a positive number" })
    .refine((val) => !isNaN(val), {
      message: "Please enter a valid number",
    }),
})
