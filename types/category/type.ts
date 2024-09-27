import {UUID} from "node:crypto";

export declare interface CategoryType {
    "id": UUID,
    "name": string,
    "image": string,
    "parentId": UUID,
    "status": boolean,
    "canDelete": boolean,
    "location": UUID,
    "isArchived": boolean
}
