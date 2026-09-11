import { AuraError } from "./aura-error.ts";
import { translateError } from "./translate.ts";
export type PublicError = { code: string; message: string; status: number; details?: Record<string, string | number | boolean | null> };
export function serializePublicError(error: unknown): PublicError { const safe = translateError(error); return { code: safe.code, message: safe.publicMessage, status: safe.status, ...(safe.details ? { details: safe.details } : {}) }; }
export function serializeServerError(error: unknown, requestId?: string) { const safe = translateError(error); return { ...serializePublicError(safe), ...(requestId ? { requestId } : {}), internalCode: safe.code }; }
export const isAuraError = (error: unknown): error is AuraError => error instanceof AuraError;
