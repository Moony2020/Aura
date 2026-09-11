import { ZodError } from "zod";
import { ERROR_CODES } from "./error-codes.ts";
import { AuraError, conflictError, validationError } from "./aura-error.ts";
export function translateError(error: unknown): AuraError {
  if (error instanceof AuraError) return error;
  if (error instanceof ZodError) return validationError("Input validation failed.", { issueCount: error.issues.length });
  if (isMongoDuplicate(error)) return conflictError("A unique persistence constraint was violated.");
  if (isMongoValidation(error)) return validationError("Persistence validation failed.");
  if (isMongoTransaction(error)) return new AuraError(ERROR_CODES.DATABASE_ERROR, "MongoDB transaction failed.", { cause: error });
  return new AuraError(ERROR_CODES.INTERNAL_ERROR, "Unexpected internal failure.", { cause: error });
}
const isMongoDuplicate = (error: unknown): error is { code: number } => typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
const isMongoValidation = (error: unknown): error is { code: number } => typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 121;
const isMongoTransaction = (error: unknown): boolean => typeof error === "object" && error !== null && "errorLabels" in error && Array.isArray((error as { errorLabels?: unknown }).errorLabels) && ((error as { errorLabels: unknown[] }).errorLabels.includes("TransientTransactionError") || (error as { errorLabels: unknown[] }).errorLabels.includes("UnknownTransactionCommitResult"));
