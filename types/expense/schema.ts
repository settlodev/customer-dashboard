import { boolean, coerce, date, number, object, preprocess, string } from "zod";

export const ExpenseSchema = object({
    name: string({ required_error: "Expense title is required" }).min(3,"Please enter a valid title",),
    expenseCategory: string({ required_error: "Expense category is required" }).uuid("Please select a valid category",),
    staff: string({ required_error: "Staff member is required" }).uuid("Please select a staff member",),
    status: boolean().optional(),
    amount: preprocess(
        (val) => {
          if (typeof val === "string" && val.trim() !== "") {
            return parseInt(val);
          }

          return val;
        },
        number({ message: "Please total expense amount should be valid number" })
          .nonnegative({ message: "Please total expense amount should be positive number" })
          .gt(0, { message: "Please total expense amount should be greater than 0" }),
      ),
      paidAmount: preprocess(
        (val) => {
          if (typeof val === "string" && val.trim() !== "") {
            return parseInt(val);
          }

          return val;
        },
        number({ message: "Please expense paid amount should be valid number" })
          .nonnegative({ message: "Please expense paid amount should be positive number" })
          .gt(0, { message: "Please expense paid amount should be greater than 0" }),
      ).optional(),
      date: string({ required_error: "Date is required" }),

})

export const ExpenseCategorySchema = object({
  name: string()
  .min(2, 'Category name must be at least 2 characters')
  .max(20, 'Category name can not be more than 20 characters'),
  status: boolean().optional(),
  image: string().optional(),
  description: string().optional()
})

export const PayableExpenseSchema = object({
  amount: string()
  .min(1, "Payment amount is required")
  .transform((val) => parseFloat(val))
  .refine((val) => !isNaN(val) && val > 0, {
    message: "Payment amount must be a valid number greater than 0",
  }),
paymentDate: date({
    required_error: "Payment date is required",
  })
  .refine((date) => date <= new Date(), {
    message: "Payment date cannot be in the future",
  }),
});
