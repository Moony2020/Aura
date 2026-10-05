import "server-only";

import type { InventoryRepository, } from "../repositories/order-inventory-repository";
import type { PaymentProviderBoundary, ProviderPaymentReference } from "./provider-boundary";

const RESERVATION_TTL_MS = 15 * 60 * 1000;

export type PaymentPreparationInput = {
  attemptId: string;
  idempotencyKey: string;
  lines: ReadonlyArray<{ variantId: string; quantity: number }>;
  amountMinor: number;
  metadata: Readonly<Record<string, string>>;
  reservationOwnerId?: string;
  now?: Date;
};

export type PaymentPreparationResult = {
  providerPayment: ProviderPaymentReference;
  reservationIds: string[];
  expiresAt: Date;
};

/**
 * P3 boundary: final commercial review is an upstream precondition. This
 * service owns only reservation-before-provider preparation and rollback.
 * Order creation, webhook reconciliation, and canonical payment transitions
 * remain later-stage responsibilities.
 */
export class PaymentPreparationService {
  private readonly inventory: InventoryRepository;
  private readonly provider: PaymentProviderBoundary;

  constructor(
    inventory: InventoryRepository,
    provider: PaymentProviderBoundary,
  ) {
    this.inventory = inventory;
    this.provider = provider;
  }

  async prepare(input: PaymentPreparationInput): Promise<PaymentPreparationResult> {
    if (!input.lines.length || input.lines.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)) {
      throw new Error("Payment preparation requires positive inventory quantities.");
    }
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("Payment preparation requires a positive external payment amount.");
    }

    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS);
    const reservations: string[] = [];

    try {
      const existingReservations = input.reservationOwnerId && this.inventory.findActiveByOrderId
        ? await this.inventory.findActiveByOrderId(input.reservationOwnerId)
        : [];
      const reusedReservationIds = new Set<string>();
      for (const line of input.lines) {
        const reusable = existingReservations.find((candidate) =>
          !reusedReservationIds.has(candidate.id)
          && candidate.variantId === line.variantId
          && candidate.quantity === line.quantity
          && candidate.expiresAt > now,
        );
        if (reusable) {
          reusedReservationIds.add(reusable.id);
          reservations.push(reusable.id);
        } else {
          const reservation = await this.inventory.reserve(line.variantId, line.quantity, expiresAt, input.reservationOwnerId);
          reservations.push(reservation.id);
        }
      }

      const providerPayment = await this.provider.createPaymentAttempt({
        attemptId: input.attemptId,
        idempotencyKey: input.idempotencyKey,
        amount: { amountMinor: input.amountMinor, currency: "SEK" },
        metadata: input.metadata,
      });

      return { providerPayment, reservationIds: reservations, expiresAt };
    } catch (error) {
      await Promise.allSettled(reservations.map((id) => this.inventory.release(id)));
      throw error;
    }
  }
}
