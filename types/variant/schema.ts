import {object, string, number, preprocess, boolean} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    price:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Price is required"}).nonnegative({message:"price can not be negative"}).gt(0,{message:"Price can not be zero"})
    ),
    quantity:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Quantity is required"}).nonnegative({message:"Quantity can not be negative"})
    ),
  
    sku: string().optional(),
    barcode: string().nullable().optional(),
    unit: string().optional(),
    description: string().optional(),
    image: string().nullable().optional(),
    color: string().nullable().optional(), 
    stockVariant: string().nullable().optional(),
});


