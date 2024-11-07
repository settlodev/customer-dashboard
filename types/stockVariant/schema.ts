import {object, string, number, preprocess} from "zod";

export const StockVariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    startingValue:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Price is required"}).nonnegative({message:"Starting value can not be negative"}).gt(0,{message:"Starting value can not be zero"})
    ),
    startingQuantity:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Starting quantity is required"}).nonnegative({message:"Starting quantity can not be negative"}).gt(0,{message:"Starting quantity can not be zero"})
    ),
 
    alertLevel: preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Alter level is required"}).nonnegative({message:"Alter level can not be negative"}).gt(0,{message:"Alter level can not be zero"})
    ),
    imageOption: string().nullable().optional(),
});


