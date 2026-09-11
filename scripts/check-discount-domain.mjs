import { discountCreateSchema } from "../src/domain/discount/discount.schema.ts";
const base = { code: "  AURA_10 ", name: "Controlled fixture", status: "ACTIVE", mode: "CODE", benefit: { kind: "PERCENTAGE", basisPoints: 1000 }, scope: { kind: "ALL_PRODUCTS" } };
const parsed = discountCreateSchema.parse(base); if (parsed.code !== "AURA_10") throw new Error("Discount code was not normalized");
for (const invalid of [{ ...base, benefit: { kind: "PERCENTAGE", basisPoints: 10001 } }, { ...base, benefit: { kind: "FIXED_AMOUNT", amountMinor: 100, currency: "US" } }, { ...base, startsAt: new Date(2), endsAt: new Date(1) }]) { try { discountCreateSchema.parse(invalid); throw new Error("Invalid discount accepted"); } catch (error) { if (error.message === "Invalid discount accepted") throw error; } }
console.log("DISCOUNT_DOMAIN_CHECK: PASS");
