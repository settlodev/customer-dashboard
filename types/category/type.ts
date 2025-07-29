import {UUID} from "node:crypto";

export declare interface Category {
    "id": UUID,
    "name": string,
    "image": string,
    "parentCategory": UUID,
    "parentCategoryName":string
    "status": boolean,
    "canDelete": boolean,
    "location": UUID,
    "locationName":string
    "productCount":number
    "productVariantsCount":number
    "isArchived": boolean
}
