import { UUID } from "crypto";

export declare interface ExpenseCategory {
    id: UUID;
    name: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}