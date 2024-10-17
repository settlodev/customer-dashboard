import {object, string, number, preprocess} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    price: string(),
    quantity: string(),
    cost: string(),
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
