export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INSUFFICIENT_INVENTORY: "INSUFFICIENT_INVENTORY",
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  RESOURCE_OWNERSHIP_ERROR: "RESOURCE_OWNERSHIP_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = { VALIDATION_ERROR: 400, NOT_FOUND: 404, CONFLICT: 409, INSUFFICIENT_INVENTORY: 422, INVALID_STATE_TRANSITION: 409, RESOURCE_OWNERSHIP_ERROR: 403, DATABASE_ERROR: 500, INTERNAL_ERROR: 500 };
export const SAFE_MESSAGES: Record<ErrorCode, string> = { VALIDATION_ERROR: "The request contains invalid values.", NOT_FOUND: "The requested resource was not found.", CONFLICT: "The request conflicts with existing data.", INSUFFICIENT_INVENTORY: "The requested quantity is not available.", INVALID_STATE_TRANSITION: "The requested state change is not allowed.", RESOURCE_OWNERSHIP_ERROR: "You are not allowed to access this resource.", DATABASE_ERROR: "Unable to complete the request.", INTERNAL_ERROR: "Unable to complete the request." };
