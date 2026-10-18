import { z } from "zod";
export const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(254),
  type: z.enum(["tattoo", "mirror"]),
  motif: z.string().max(160).default(""),
  placement: z.string().max(160).default(""),
  size: z.string().max(80).default(""),
  message: z.string().trim().min(10).max(4000),
  consent: z.literal("yes"),
  website: z.string().max(200).default(""),
});
