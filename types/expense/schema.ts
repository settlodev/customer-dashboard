import { boolean, number, object, string } from "zod";

export const ExpenseSchema = object({
    name: string({ required_error: "Expense title is required" }).min(3,"Please enter a valid title",),
    amount:number({ required_error: "Expense amount is required" }).min(1,"Please enter a valid amount",),
    expenseCategory: string({ required_error: "Expense category is required" }).uuid("Please select a valid category",),
    status: boolean().optional(),
})