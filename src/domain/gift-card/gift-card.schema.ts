import { z } from "zod";
import { objectIdSchema } from "../shared/identifiers.ts";

export const giftCardStatusSchema = z.enum(["ACTIVE", "DISABLED", "DEPLETED"]);
export const giftCardTransactionTypeSchema = z.enum(["ISSUE", "REDEEM", "CREDIT"]);
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const giftCardCreateSchema = z.object({
  codeHash: z.string().regex(/^[a-f0-9]{64}$/), status: giftCardStatusSchema.default("ACTIVE"), initialBalanceMinor: z.number().int().positive(), remainingBalanceMinor: z.number().int().nonnegative(), currency: currencySchema,
}).strict().superRefine((card, ctx) => { if (card.remainingBalanceMinor > card.initialBalanceMinor) ctx.addIssue({ code: "custom", path: ["remainingBalanceMinor"], message: "Remaining balance cannot exceed initial balance." }); if (card.remainingBalanceMinor === 0 && card.status === "ACTIVE") ctx.addIssue({ code: "custom", path: ["status"], message: "Zero-balance cards cannot be active." }); });
export const giftCardSchema = z.object({ codeHash: z.string().regex(/^[a-f0-9]{64}$/), status: giftCardStatusSchema, initialBalanceMinor: z.number().int().positive(), remainingBalanceMinor: z.number().int().nonnegative(), currency: currencySchema, id: objectIdSchema, createdAt: z.date(), updatedAt: z.date() }).strict().superRefine((card, ctx) => { if (card.remainingBalanceMinor > card.initialBalanceMinor) ctx.addIssue({ code: "custom", path: ["remainingBalanceMinor"], message: "Remaining balance cannot exceed initial balance." }); if (card.remainingBalanceMinor === 0 && card.status === "ACTIVE") ctx.addIssue({ code: "custom", path: ["status"], message: "Zero-balance cards cannot be active." }); });
export const giftCardTransactionCreateSchema = z.object({ giftCardId: objectIdSchema, type: giftCardTransactionTypeSchema, amountMinor: z.number().int().positive(), balanceBeforeMinor: z.number().int().nonnegative(), balanceAfterMinor: z.number().int().nonnegative(), reference: z.string().trim().min(1).max(160).optional(), createdAt: z.date() }).strict();
export const giftCardTransactionSchema = z.object({ giftCardId: objectIdSchema, type: giftCardTransactionTypeSchema, amountMinor: z.number().int().positive(), balanceBeforeMinor: z.number().int().nonnegative(), balanceAfterMinor: z.number().int().nonnegative(), reference: z.string().trim().min(1).max(160).optional(), createdAt: z.date(), id: objectIdSchema }).strict();
export type GiftCard = z.output<typeof giftCardSchema>;
export type GiftCardCreateInput = z.input<typeof giftCardCreateSchema>;
export type GiftCardTransaction = z.output<typeof giftCardTransactionSchema>;
