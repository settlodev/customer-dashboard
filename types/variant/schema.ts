import {object, string, number, preprocess, boolean} from "zod";

export const VariantSchema = object({
    id: string().uuid().optional().nullish(),
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
    purchasingPrice: preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val)
            }
            return undefined
        },
        number({ message: "Purchasing price is required" }).nonnegative({ message: "Purchasing price can not be negative" }).gt(0, { message: "Purchasing price can not be zero" }).optional()
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
