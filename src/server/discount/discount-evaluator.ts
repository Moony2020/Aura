import "server-only";
import type { Discount } from "../../domain/discount/discount.schema.ts";
export type DiscountEvaluationLine = { productId: string; subtotalMinor: number; collectionIds?: readonly string[]; eligibleForPurchase?: boolean };
export type DiscountEvaluation = { eligible: boolean; code: string | null; discountAmountMinor: number; eligibleSubtotalMinor: number; payableSubtotalMinor: number; reasonCode: "APPLIED" | "NOT_ACTIVE" | "NOT_STARTED" | "EXPIRED" | "MINIMUM_NOT_MET" | "CURRENCY_MISMATCH" | "NO_ELIGIBLE_LINES" | "USAGE_LIMIT_REACHED" | null };
export function evaluateDiscount(discount: Discount, lines: readonly DiscountEvaluationLine[], options: { currency: string; now?: Date; code?: string }): DiscountEvaluation {
  const now = options.now ?? new Date(); const fail = (reasonCode: DiscountEvaluation["reasonCode"]): DiscountEvaluation => ({ eligible: false, code: discount.code ?? null, discountAmountMinor: 0, eligibleSubtotalMinor: 0, payableSubtotalMinor: lines.reduce((sum, line) => sum + Math.max(0, line.subtotalMinor), 0), reasonCode });
  if (discount.status !== "ACTIVE") return fail("NOT_ACTIVE");
  if (discount.startsAt && now < discount.startsAt) return fail("NOT_STARTED");
  if (discount.endsAt && now > discount.endsAt) return fail("EXPIRED");
  if (discount.totalUsageLimit === 0) return fail("USAGE_LIMIT_REACHED");
  if (discount.mode === "CODE" && discount.code !== options.code?.trim().toUpperCase()) return fail("NOT_ACTIVE");
  const eligibleLines = lines.filter((line) => line.eligibleForPurchase !== false && (discount.scope.kind === "ALL_PRODUCTS" || (discount.scope.kind === "PRODUCTS" ? discount.scope.productIds.includes(line.productId) : (line.collectionIds ?? []).some((id) => discount.scope.kind === "COLLECTIONS" && discount.scope.collectionIds.includes(id)))));
  const eligibleSubtotalMinor = eligibleLines.reduce((sum, line) => sum + Math.max(0, Math.trunc(line.subtotalMinor)), 0);
  if (!eligibleSubtotalMinor) return fail("NO_ELIGIBLE_LINES");
  if (discount.minimumSubtotalMinor && eligibleSubtotalMinor < discount.minimumSubtotalMinor) return fail("MINIMUM_NOT_MET");
  if (discount.benefit.kind === "FIXED_AMOUNT" && discount.benefit.currency !== options.currency) return fail("CURRENCY_MISMATCH");
  const raw = discount.benefit.kind === "PERCENTAGE" ? Math.floor(eligibleSubtotalMinor * discount.benefit.basisPoints / 10_000) : discount.benefit.amountMinor;
  const capped = Math.min(raw, discount.maximumDiscountMinor ?? Number.MAX_SAFE_INTEGER, eligibleSubtotalMinor);
  return { eligible: true, code: discount.code ?? null, discountAmountMinor: capped, eligibleSubtotalMinor, payableSubtotalMinor: Math.max(0, lines.reduce((sum, line) => sum + Math.max(0, line.subtotalMinor), 0) - capped), reasonCode: "APPLIED" };
}
