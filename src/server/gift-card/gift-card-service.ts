import "server-only";
import { z } from "zod";
import { AuraError } from "../../lib/errors/aura-error.ts";
import { ERROR_CODES } from "../../lib/errors/error-codes.ts";
import type { GiftCardRepository } from "../repositories/gift-card-repository.ts";
import { MongoGiftCardRepository } from "../repositories/mongo-gift-card-repository.ts";
import { generateGiftCardCode, hashGiftCardCode, normalizeGiftCardCode, maskGiftCardCode } from "./gift-card-token.ts";
const codeSchema = z.string().trim().min(8).max(80); const amountSchema = z.number().int().positive();
export type GiftCardValidationResult = { valid: boolean; availableBalanceMinor: number; currency: string | null; maskedCode?: string };
export class GiftCardService {
  private readonly cards: GiftCardRepository;
  constructor(cards: GiftCardRepository = new MongoGiftCardRepository()) { this.cards = cards; }
  async issueGiftCard(input: { initialBalanceMinor: number; currency: string }) { const amount = amountSchema.parse(input.initialBalanceMinor); const currency = z.string().regex(/^[A-Z]{3}$/).parse(input.currency); for (let attempt = 0; attempt < 5; attempt += 1) { const rawCode = generateGiftCardCode(); try { const result = await this.cards.issue({ codeHash: hashGiftCardCode(rawCode), initialBalanceMinor: amount, currency }); return { ...result, rawCode }; } catch (error) { if ((error as { code?: number }).code !== 11000 || attempt === 4) throw error; } } throw new AuraError(ERROR_CODES.INTERNAL_ERROR, "Gift card issuance failed."); }
  async validateGiftCard(code: string, currency: string): Promise<GiftCardValidationResult> { const normalized = normalizeGiftCardCode(codeSchema.parse(code)); const card = await this.cards.findByCodeHash(hashGiftCardCode(normalized)); if (!card || card.status !== "ACTIVE" || card.currency !== currency.toUpperCase()) return { valid: false, availableBalanceMinor: 0, currency: null }; return { valid: true, availableBalanceMinor: card.remainingBalanceMinor, currency: card.currency, maskedCode: maskGiftCardCode(normalized) }; }
  async redeemGiftCard(code: string, amountMinor: number, reference: string, currency: string) { const normalized = normalizeGiftCardCode(codeSchema.parse(code)); const amount = amountSchema.parse(amountMinor); const card = await this.cards.findByCodeHash(hashGiftCardCode(normalized)); if (!card || card.status !== "ACTIVE" || card.currency !== currency.toUpperCase()) throw new AuraError(ERROR_CODES.CONFLICT, "Gift card is unavailable."); return this.cards.redeem(card.id, amount, z.string().trim().min(1).max(160).parse(reference)); }
}
export const createGiftCardService = (repository?: GiftCardRepository) => new GiftCardService(repository);
