import {object, string, number, preprocess} from "zod";

export const StockVariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    startingValue: preprocess(
        (val) => {
            // Handle empty strings and convert to 0
            if (typeof val === "string" && val.trim() === "") {
                return 0;
            }
            if (typeof val === "string" && val.trim() !== "") {
                return parseFloat(val); // Use parseFloat for decimal values
            }
            return val;
        },
        number({ message: "Starting value is required" }).nonnegative({ message: "Starting value cannot be negative" })
    ),
    startingQuantity: preprocess(
        (val) => {
            // Handle empty strings and convert to 0
            if (typeof val === "string" && val.trim() === "") {
                return 1;
            }
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val);
            }
            return val;
        },
        number({ message: "Starting quantity is required" }).nonnegative({ message: "Starting quantity cannot be negative" })
    ),
    alertLevel: preprocess(
        (val) => {
            // Handle empty strings and convert to 0
            if (typeof val === "string" && val.trim() === "") {
                return 0;
            }
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val);
            }
            return val;
        },
        number({ message: "Alert level is required" }).nonnegative({ message: "Alert level cannot be negative" })
    ),
    imageOption: string().nullable().optional(),
}).refine(
    (data) => {
        // If startingQuantity is zero, startingValue must also be zero
        if (data.startingQuantity === 0) {
            return data.startingValue === 0;
        }
        return true;
    },
    {
        message: "Starting value must be zero when starting quantity is zero",
        path: ["startingValue"]
    }
);