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
        number({message:"Price is required"}).nonnegative({message:"price can not be negative"}).gt(0,{message:"Price can not be zero"})
    ),
    quantity:preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Quantity is required"}).nonnegative({message:"Quantity can not be negative"}).gt(0,{message:"Quantity can not be zero"})
    ),
    cost: preprocess(
        (val)=>{
            if(typeof val==="string" && val.trim()!==""){
                return parseInt(val)
            }
            return val
        },
        number({message:"Cost is required"}).nonnegative({message:"Cost can not be negative"}).gt(0,{message:"Cost can not be zero"})
    ),
    sku: string().optional(),
    description: string().optional(),
    image: string().optional(),
    color: string().optional()
});


/*price: preprocess((val)=>{
        if(typeof val === "string" && val.trim() !== ""){
            return parseFloat(val)
        }
    }, number({ message: "Please enter a valid number" })
        .nonnegative({ message: "Please enter a positive number" })
        .gt(0, "Amount must be greater than zero")
    ),
    cost: preprocess((val)=>{
            if(typeof val === "string" && val.trim() !== ""){
                return parseFloat(val)
            }
        }, number({ message: "Please enter a valid number" })
            .nonnegative({ message: "Please enter a positive number" })
            .gt(0, "Amount must be greater than zero")
    ),
    quantity: preprocess((val)=>{
            if(typeof val === "string" && val.trim() !== ""){
                return parseFloat(val)
            }
        }, number({ message: "Please enter a valid number" })
            .nonnegative({ message: "Please enter a positive number" })
            .gt(0, "Amount must be greater than zero")
    ),*/
