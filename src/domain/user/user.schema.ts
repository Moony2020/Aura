import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;
const countryCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/);
const emailSchema = z.string().trim().email().max(320);
const nameSchema = z.string().trim().min(1).max(120);
const phoneSchema = z.string().trim().min(3).max(40).regex(/^[+()\d\s.-]+$/).optional();

export const userRoleSchema = z.enum(["CUSTOMER", "ADMIN"]);
export const userStatusSchema = z.enum(["PENDING", "ACTIVE", "DISABLED"]);
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const userCreateSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  role: userRoleSchema.default("CUSTOMER"),
  status: userStatusSchema.default("PENDING"),
  emailVerifiedAt: z.date().nullable().default(null),
}).transform((user) => ({ ...user, email: normalizeEmail(user.email), normalizedEmail: normalizeEmail(user.email) }));

export const userProfileUpdateSchema = z.object({ firstName: nameSchema.optional(), lastName: nameSchema.optional(), phone: phoneSchema.nullable().optional() }).strict().refine((value) => Object.keys(value).length > 0, "At least one profile field is required.");
export const userStatusUpdateSchema = z.object({ status: userStatusSchema });
export const userSchema = z.object({
  id: z.string().regex(objectIdPattern),
  email: emailSchema,
  normalizedEmail: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict();

export const addressCreateSchema = z.object({
  userId: z.string().regex(objectIdPattern), recipientFirstName: nameSchema, recipientLastName: nameSchema,
  company: z.string().trim().max(160).optional(), addressLine1: z.string().trim().min(1).max(240), addressLine2: z.string().trim().max(240).optional(),
  city: z.string().trim().min(1).max(120), region: z.string().trim().max(120).optional(), postalCode: z.string().trim().min(1).max(40), countryCode: countryCodeSchema,
  phone: phoneSchema, defaultShipping: z.boolean().default(false), defaultBilling: z.boolean().default(false),
});
export const addressUpdateSchema = addressCreateSchema.omit({ userId: true }).partial().refine((value) => Object.keys(value).length > 0, "At least one address field is required.");
export const addressSchema = addressCreateSchema.extend({ id: z.string().regex(objectIdPattern), createdAt: z.date(), updatedAt: z.date() });

export type User = z.output<typeof userSchema>; export type UserCreateInput = z.input<typeof userCreateSchema>; export type UserProfileUpdate = z.input<typeof userProfileUpdateSchema>; export type UserStatusUpdate = z.input<typeof userStatusUpdateSchema>;
export type Address = z.output<typeof addressSchema>; export type AddressCreateInput = z.input<typeof addressCreateSchema>; export type AddressUpdateInput = z.input<typeof addressUpdateSchema>;
