import { giftCardCreateSchema } from "../src/domain/gift-card/gift-card.schema.ts";
const valid = giftCardCreateSchema.parse({ codeHash: "a".repeat(64), initialBalanceMinor: 5000, remainingBalanceMinor: 5000, currency: "USD" }); if (valid.remainingBalanceMinor !== 5000) throw new Error("Gift card balance failed");
for (const invalid of [{ ...valid, remainingBalanceMinor: 5001 }, { ...valid, initialBalanceMinor: 0 }, { ...valid, codeHash: "plaintext" }]) { try { giftCardCreateSchema.parse(invalid); throw new Error("Invalid gift card accepted"); } catch (error) { if (error.message === "Invalid gift card accepted") throw error; } }
console.log("GIFT_CARD_DOMAIN_CHECK: PASS");
