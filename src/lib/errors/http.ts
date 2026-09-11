import { serializePublicError, type PublicError } from "./serialize.ts";
export function toSafeHttpError(error: unknown): { status: number; body: PublicError } { const body = serializePublicError(error); return { status: body.status, body }; }
