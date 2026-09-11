import { z } from "zod";
import { objectIdSchema } from "../shared/identifiers.ts";

export const discountStatusSchema = z.enum(["DRAFT", "ACTIVE", "DISABLED"]);
export const discountApplicationModeSchema = z.enum(["CODE", "AUTOMATIC"]);
export const discountCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,63}$/);
export const percentageBasisPointsSchema = z.number().int().positive().max(10_000);
export const minorAmountSchema = z.number().int().positive();
export const discountBenefitSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PERCENTAGE"), basisPoints: percentageBasisPointsSchema }).strict(),
  z.object({ kind: z.literal("FIXED_AMOUNT"), amountMinor: minorAmountSchema, currency: z.string().regex(/^[A-Z]{3}$/) }).strict(),
]);
export const discountScopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ALL_PRODUCTS"), productIds: z.never().optional(), collectionIds: z.never().optional() }).strict(),
  z.object({ kind: z.literal("PRODUCTS"), productIds: z.array(objectIdSchema).min(1).max(500), collectionIds: z.never().optional() }).strict(),
  z.object({ kind: z.literal("COLLECTIONS"), collectionIds: z.array(objectIdSchema).min(1).max(500), productIds: z.never().optional() }).strict(),
]);
const base = z.object({
  code: discountCodeSchema.optional(), name: z.string().trim().min(1).max(160), status: discountStatusSchema.default("DRAFT"), mode: discountApplicationModeSchema.default("CODE"), benefit: discountBenefitSchema, scope: discountScopeSchema,
  minimumSubtotalMinor: z.number().int().nonnegative().optional(), maximumDiscountMinor: minorAmountSchema.optional(), totalUsageLimit: z.number().int().positive().optional(), startsAt: z.date().optional(), endsAt: z.date().optional(),
}).strict();
const withInvariants = base.superRefine((discount, ctx) => {
  if (discount.mode === "CODE" && !discount.code) ctx.addIssue({ code: "custom", path: ["code"], message: "CODE discounts require a code." });
  if (discount.startsAt && discount.endsAt && discount.startsAt > discount.endsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Discount window is invalid." });
  if (discount.maximumDiscountMinor && discount.benefit.kind !== "PERCENTAGE") ctx.addIssue({ code: "custom", path: ["maximumDiscountMinor"], message: "Only percentage discounts support a cap." });
  if (discount.scope.kind === "PRODUCTS" && new Set(discount.scope.productIds).size !== discount.scope.productIds.length) ctx.addIssue({ code: "custom", path: ["scope", "productIds"], message: "Duplicate product scope IDs are not allowed." });
  if (discount.scope.kind === "COLLECTIONS" && new Set(discount.scope.collectionIds).size !== discount.scope.collectionIds.length) ctx.addIssue({ code: "custom", path: ["scope", "collectionIds"], message: "Duplicate collection scope IDs are not allowed." });
});
export const discountCreateSchema = withInvariants;
export const discountSchema = z.intersection(withInvariants, z.object({ id: objectIdSchema, createdAt: z.date(), updatedAt: z.date() }));
export type Discount = z.output<typeof discountSchema>;
export type DiscountCreateInput = z.input<typeof discountCreateSchema>;
