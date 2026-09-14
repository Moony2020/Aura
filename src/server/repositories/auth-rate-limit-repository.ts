import type { ClientSession } from "mongodb";
import type { AuthRateLimitKind } from "../../domain/auth/auth-rate-limit.schema.ts";
export type RateLimitAttempt = { keyHash:string; kind:AuthRateLimitKind; limit:number; windowMs:number; now:Date; minimumSpacingMs?:number; session?:ClientSession };
export type RateLimitResult = { allowed:boolean; count:number; retryAfterSeconds:number; spacingViolation:boolean };
export interface AuthRateLimitRepository { current(input:{keyHash:string;kind:AuthRateLimitKind;now:Date;session?:ClientSession}):Promise<{count:number;lastAttemptAt?:Date;expiresAt:Date}|null>; attempt(input:RateLimitAttempt):Promise<RateLimitResult>; }
