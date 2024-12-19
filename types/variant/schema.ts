import {object, string, number, preprocess, boolean} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }).min(2, "Variant name is required"),
    price: preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val)
            }
            return val
        },
        number({ message: "Price is required" }).nonnegative({ message: "Price can not be negative" }).gt(0, { message: "Price can not be zero" })
    ),
    sku: string().optional().nullish(),
    barcode: string().nullable().optional(),
    unit: string().nullable().optional(),
    description: string().nullable().optional(),
    image: string().nullable().optional(),
    color: string().nullable().optional(),
    trackInventory: boolean().default(false),
    trackingType: string().optional().nullish(),
    trackItem: string().optional().nullish(),
}).superRefine((data, ctx) => {
    if (data.trackInventory && data.trackingType && !data.trackItem) {
        ctx.addIssue({
            code: "custom",
            message: "Please select a tracking item",
            path: ["trackItem"]
        });
    }
});
