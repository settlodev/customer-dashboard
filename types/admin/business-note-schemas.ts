import { z } from "zod";

export const CreateBusinessNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Add some text before posting")
    .max(4000, "Note can't exceed 4000 characters"),
  pinned: z.boolean().optional(),
});

export const UpdateBusinessNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Add some text before saving")
    .max(4000, "Note can't exceed 4000 characters"),
});
