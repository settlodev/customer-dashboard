import { boolean, number, object, preprocess, string } from "zod";

export const ExpenseSchema = object({
    name: string({ required_error: "Expense title is required" }).min(3,"Please enter a valid title",),
    expenseCategory: string({ required_error: "Expense category is required" }).uuid("Please select a valid category",),
    status: boolean().optional(),
    amount: preprocess(
        (val) => {
          if (typeof val === "string" && val.trim() !== "") {
            return parseInt(val);
          }
      
          return val;
        },
        number({ message: "Please expense amount should be valid number" })
          .nonnegative({ message: "Please expense amount should be positive number" })
          .gt(0, { message: "Please expense amount should be greater than 0" }),
      ),
      date: string({ required_error: "Date is required" }),
    
})