import { boolean, number, object, string, array, enum as zenum, preprocess } from "zod";

const optionalPositiveNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().positive().optional(),
);

const optionalNonNegativeNumber = preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  number().nonnegative().optional(),
);

const requiredPositiveNumber = (message: string) =>
  preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return val;
    },
    number({ message }).positive({ message: `${message} (must be positive)` }),
  );

export const SpaceSchema = object({
  name: string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  code: string().max(50, "Code cannot exceed 50 characters").optional(),
  capacity: requiredPositiveNumber("Capacity is required"),
  minCapacity: optionalPositiveNumber,
  type: zenum(
    ["TABLE", "SEAT", "ROOM", "SECTION", "TERRACE", "BAR", "COUNTER", "HALL"],
    { required_error: "Type is required" },
  ),
  tableStatus: zenum(
    ["AVAILABLE", "RESERVED", "SEATED", "OCCUPIED", "DIRTY", "OUT_OF_SERVICE"],
  ).optional(),
  active: boolean().default(true),
  reservable: boolean().default(true),
  turnTimeMinutes: optionalPositiveNumber,
  posX: optionalNonNegativeNumber,
  posY: optionalNonNegativeNumber,
  color: string().optional(),
  needsCleaning: boolean().default(false),
  description: string().optional(),
  sortOrder: optionalNonNegativeNumber,
  parentSpaceId: string().uuid("Please select a valid parent space").optional(),
  floorPlanId: string().uuid("Please select a valid floor plan").optional(),
  status: boolean().optional(),
}).refine(
  (data) => {
    if (data.minCapacity && data.minCapacity > data.capacity) return false;
    return true;
  },
  {
    message: "Minimum capacity cannot exceed maximum capacity",
    path: ["minCapacity"],
  },
);

export const FloorPlanSchema = object({
  name: string({ required_error: "Floor plan name is required" })
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  description: string().optional(),
  width: optionalPositiveNumber,
  height: optionalPositiveNumber,
  isDefault: boolean().default(false),
});

export const TableCombinationSchema = object({
  name: string({ required_error: "Combination name is required" })
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  capacity: requiredPositiveNumber("Capacity is required"),
  tableIds: array(string().uuid(), {
    required_error: "At least one table is required",
  }).min(1, "At least one table is required"),
});
