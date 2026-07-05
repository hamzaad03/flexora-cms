import { z } from "zod";

const roleSlugSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "Role slug must be kebab-case.");

export const userCreateInputSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
  isActive: z.boolean().default(true),
  roles: z.array(roleSlugSchema).min(1, "Choose at least one role."),
});

export const userUpdateInputSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().max(255).toLowerCase(),
  isActive: z.boolean().default(true),
  roles: z.array(roleSlugSchema).min(1, "Choose at least one role."),
});

export const passwordResetInputSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

export const accountInputSchema = z.object({
  name: z.string().max(120).optional().nullable(),
});

export const ownPasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(128),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different.",
    path: ["newPassword"],
  });

export const roleInputSchema = z.object({
  slug: roleSlugSchema,
  name: z.string().min(1, "Role name is required.").max(120),
  description: z.string().max(500).optional().nullable(),
  permissions: z.array(z.string()).default([]),
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateInputSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetInputSchema>;
export type AccountInput = z.infer<typeof accountInputSchema>;
export type OwnPasswordInput = z.infer<typeof ownPasswordInputSchema>;
export type RoleInput = z.infer<typeof roleInputSchema>;
