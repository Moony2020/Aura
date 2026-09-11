import { discountCreateSchema } from "../src/domain/discount/discount.schema.ts";
import { evaluateDiscount } from "../src/server/discount/discount-evaluator.ts";
const discount = discountCreateSchema.parse({ code: "AURA10", name: "Fixture", status: "ACTIVE", mode: "CODE", benefit: { kind: "PERCENTAGE", basisPoints: 1000 }, scope: { kind: "ALL_PRODUCTS" } });
const result = evaluateDiscount(discount, [{ productId: "507f1f77bcf86cd799439011", subtotalMinor: 7500 }], { currency: "USD", code: " aura10 " });
if (!result.eligible || result.discountAmountMinor !== 750 || result.payableSubtotalMinor !== 6750) throw new Error("Percentage evaluation failed");
console.log("DISCOUNT_EVALUATION_CHECK: PASS");
