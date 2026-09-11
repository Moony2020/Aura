import { translateError } from "./translate.ts";
export function safeErrorLog(error: unknown, operation: string, context?: Record<string, string | number | boolean>) { const safe = translateError(error); return { code: safe.code, operation, timestamp: new Date().toISOString(), ...(context ? { context } : {}) }; }
