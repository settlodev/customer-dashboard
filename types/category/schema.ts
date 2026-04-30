import { boolean, number, object, string } from "zod";

export const CategorySchema = object({
  name: string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name can not exceed 50 characters"),
  description: string().optional(),
  imageUrl: string().optional(),
  parentId: string().nullable().optional(),
  // Every location is guaranteed to own at least one department, so a
  // category must always belong to one. The form auto-selects when the
  // location has a single department and shows a picker when it has
  // several.
  departmentId: string().uuid({ message: "Department is required" }),
  sortOrder: number().optional(),
  active: boolean().optional(),
});
