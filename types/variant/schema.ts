import {object, string, number, preprocess} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    price:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Price is required"}).nonnegative({message:"Price can not be negative"}).gt(0,{message:"Price can not be zero"})
    ),
    sku: string().optional(),
    barcode: string().nullable().optional(),
    unit: string().nullable().optional(),
    description: string().nullable().optional(),
    image: string().nullable().optional(),
    color: string().nullable().optional(),

    stockVariant: string().nullable().optional(),
    recipe:string().nullable().optional(),

});


