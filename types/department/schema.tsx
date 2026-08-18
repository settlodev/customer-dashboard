import { number, object, preprocess, record, string, unknown } from "zod";

export const DepartmentSchema = object({
  name: string({ required_error: "Department name is required" }).min(2, "Name must be at least 2 characters").max(255),
  description: preprocess((val) => (val === null || val === "" ? undefined : val), string().max(1000).optional()),
  color: preprocess((val) => (val === null || val === "" ? undefined : val), string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color").optional()),
  image: preprocess((val) => (val === null || val === "" ? undefined : val), string().url().max(500).optional()),
  order: preprocess((val) => (val === null || val === "" || val === undefined ? undefined : Number(val)), number().int().optional()),
  defaultPosView: preprocess((val) => (val === null || val === "" ? undefined : val), string().regex(/^(GRID|LIST)$/).optional()),
  metadata: record(string(), unknown()).optional(),
});
