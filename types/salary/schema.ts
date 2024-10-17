import { boolean, number, object, preprocess, string } from "zod";

export const SalarySchema = object({
    amount:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Amount is required"}).nonnegative({message:"Amount can not be negative"}).gt(0,{message:"Amount can not be zero"})
    ),
    frequency:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Frequency is required"}).nonnegative({message:"Frequency can not be negative"}).gt(0,{message:"Frequency can not be zero"})
    ),
    accountNumber: string({ required_error: "Account number is required" }).min(3, "Account number should be at least 3 characters").max(50, "Account number can not be more than 50 characters"),
    bankName: string({required_error: "Name of space is required"}).min(3, "Name of space should be at least 3 characters").max(50, "Name of space can not be more than 50 characters"),
    branch: string().optional(),
    status: boolean().optional(),
})