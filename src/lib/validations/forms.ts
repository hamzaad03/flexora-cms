import { z } from "zod";

import { FORM_FIELD_TYPES } from "@/lib/forms";

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(FORM_FIELD_TYPES),
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "lowercase letters, numbers, underscore"),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  width: z.enum(["full", "half"]).optional(),
});

export const formSettingsSchema = z.object({
  successMessage: z.string().max(500).optional(),
  submitLabel: z.string().max(80).optional(),
  requireCaptcha: z.boolean().optional(),
});

export const formInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "kebab-case")
    .optional(),
  isActive: z.boolean().default(true),
  fields: z.array(formFieldSchema).default([]),
  settings: formSettingsSchema.default({}),
});
export type FormInput = z.infer<typeof formInputSchema>;
