import { z } from "zod";

const phoneRegex = /^\d{10,15}$/;
const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
const isoCurrencyRegex = /^[A-Z]{3}$/;

export const socialSchema = z
  .object({
    whatsapp: z
      .string()
      .refine((s) => /^\d{7,15}$/.test(s), {
        message: "WhatsApp must be digits only, 7-15 digits",
      })
      .optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    x: z.string().optional(),
  })
  .passthrough();

export const addressPatchSchema = z.object({
  line1: z.string().max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export const payoutPatchSchema = z
  .object({
    provider: z.enum(["MPESA", "BANK", "STRIPE", "NONE"]).optional(),
    accountRef: z.string().max(100).optional(),
    bankName: z.string().max(100).optional(),
  })
  .passthrough();

export const payoutAccountSchema = z.object({
  accountRef: z
    .string()
    .min(1, "Account reference is required")
    .max(100),
});

export const businessPatchSchema = z
  .object({
    legalName: z.string().max(140).optional(),
    regNumber: z.string().max(100).optional(),
    taxPin: z.string().max(50).optional(),
  })
  .passthrough();

export const accountUpdateSchema = z
  .object({
  displayName: z.string().min(2).max(80).optional(),
  phone: z
    .string()
    .min(1)
    .max(20)
    .regex(phoneRegex, "Phone must be E.164 digits")
    .optional(),
  email: z.string().email().optional(),
  store: z
    .object({
    name: z.string().min(2).max(80).optional(),
    slug: z
      .string()
      .min(1)
      .max(60)
      .regex(slugRegex, "Slug can only contain lowercase letters, numbers, and hyphens")
      .optional(),
    tagline: z.string().max(140).optional(),
    description: z.string().max(2000).optional(),
    themeColor: z.string().regex(hexColorRegex, "Must be a valid hex colour (#RRGGBB)").optional(),
    currency: z
      .string()
      .length(3)
      .regex(isoCurrencyRegex)
      .optional(),
    supportHours: z.string().max(80).optional(),
    social: socialSchema.optional(),
  })
  .passthrough()
  .optional(),
  address: addressPatchSchema.optional(),
  business: businessPatchSchema.optional(),
  payout: payoutPatchSchema.optional(),
  settings: z
    .object({
      defaultLowStockThreshold: z.number().int().nonnegative().optional(),
      autoHideOutOfStock: z.boolean().optional(),
      notifyLowStock: z.boolean().optional(),
      notifyNewInquiry: z.boolean().optional(),
    })
    .optional(),
  })
  .passthrough();

export const FORBIDDEN_ACCOUNT_FIELDS = new Set([
  "role",
  "status",
  "passwordHash",
  "refreshTokenHash",
  "passwordChangedAt",
  "stats",
  "isVerified",
]);

export const PASSWORD_RULES = {
  minLength: 10,
  requireLetter: true,
  requireNumber: true,
} as const;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(
        PASSWORD_RULES.minLength,
        `Password must be at least ${PASSWORD_RULES.minLength} characters`,
      )
      .refine(
        (s) => /[a-zA-Z]/.test(s) && /\d/.test(s),
        "Password must contain at least one letter and one number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type AccountUpdateBody = z.infer<typeof accountUpdateSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
