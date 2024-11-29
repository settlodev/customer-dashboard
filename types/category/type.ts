import {UUID} from "node:crypto";

export declare interface Category {
    "id": UUID,
    "name": string,
    "image": string,
    "parentCategory": UUID,
    "status": boolean,
    "canDelete": boolean,
    "location": UUID,
    "isArchived": boolean
}
