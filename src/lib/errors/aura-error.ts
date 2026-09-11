import { ERROR_HTTP_STATUS, ERROR_CODES, SAFE_MESSAGES, type ErrorCode } from "./error-codes.ts";
export type SafeDetails = Record<string, string | number | boolean | null>;
export class AuraError extends Error {
  readonly code: ErrorCode; readonly status: number; readonly publicMessage: string; readonly details?: SafeDetails;
  constructor(code: ErrorCode, internalMessage: string, options?: { details?: SafeDetails; cause?: unknown; publicMessage?: string }) { super(internalMessage, { cause: options?.cause }); this.name = "AuraError"; this.code = code; this.status = ERROR_HTTP_STATUS[code]; this.publicMessage = options?.publicMessage ?? SAFE_MESSAGES[code]; this.details = options?.details; }
}
export const validationError = (message = "Validation failed.", details?: SafeDetails) => new AuraError(ERROR_CODES.VALIDATION_ERROR, message, { details });
export const notFoundError = (resource = "Resource") => new AuraError(ERROR_CODES.NOT_FOUND, `${resource} was not found.`);
export const conflictError = (message = "Resource conflict.", details?: SafeDetails) => new AuraError(ERROR_CODES.CONFLICT, message, { details });
export const insufficientInventoryError = (variantId?: string) => new AuraError(ERROR_CODES.INSUFFICIENT_INVENTORY, "Inventory is insufficient.", { details: variantId ? { variantId } : undefined });
export const invalidStateTransitionError = (from: string, to: string) => new AuraError(ERROR_CODES.INVALID_STATE_TRANSITION, `Transition ${from} -> ${to} is not allowed.`, { details: { from, to } });
export const ownershipError = () => new AuraError(ERROR_CODES.RESOURCE_OWNERSHIP_ERROR, "Resource ownership check failed.");
