import { generateGiftCardCode, hashGiftCardCode, normalizeGiftCardCode } from "../src/server/gift-card/gift-card-token.ts";
const code = generateGiftCardCode(); if (normalizeGiftCardCode(` ${code.slice(0, 4)}-${code.slice(4)} `) !== normalizeGiftCardCode(code) || hashGiftCardCode(code) === code) throw new Error("Gift card secret handling failed"); console.log("GIFT_CARD_BALANCE_CHECK: PASS");
