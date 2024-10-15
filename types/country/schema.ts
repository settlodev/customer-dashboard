import { object, string } from "zod";

export const CountrySchema = object({
    name: string().min(2, 'Country name must be less than 2 characters').max(20, 'Country name can not be more than 20 characters'),
    code: string().min(2, 'Country code must be less than 2 characters').max(20, 'Country code can not be more than 20 characters'),
    currencyCode:string().min(2, 'Currency code must be less than 2 characters').max(20, 'Currency code can not be more than 20 characters'),
    locale: string().optional(),
    supported: string().optional()
})