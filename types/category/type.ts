import {UUID} from "node:crypto";

export declare interface Category {
    "id": UUID,
    "name": string,
    "image": string,
    "parentCategory": UUID,
    "parentCategoryName": string,
    "status": boolean,
    "canDelete": boolean,
    "location": UUID,
    "locationName": string,
    "isArchived": boolean,
    "subcats": SubCategory[]
}

export interface SubCategory {
    id: UUID,
    name: string,
    image: string,
    parentCategory: UUID,
    "parentCategoryName": string,
    "status": boolean,
    "canDelete": boolean,
    "location": UUID,
    "locationName": string,
    "isArchived": boolean,
}


