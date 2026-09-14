import "server-only";
import { createHash } from "node:crypto";
import { normalizeEmail } from "../../domain/user/user.schema.ts";
import type { AuthRateLimitKind } from "../../domain/auth/auth-rate-limit.schema.ts";
import { MongoAuthRateLimitRepository } from "../repositories/mongo-auth-rate-limit-repository.ts";
import type { AuthRateLimitRepository } from "../repositories/auth-rate-limit-repository.ts";
const repo=new MongoAuthRateLimitRepository();
const policy:Record<AuthRateLimitKind,{limit:number;windowMs:number;spacingMs?:number}>={LOGIN_ACCOUNT:{limit:5,windowMs:900000},LOGIN_IP:{limit:20,windowMs:900000},REGISTRATION_EMAIL:{limit:3,windowMs:3600000},REGISTRATION_IP:{limit:10,windowMs:3600000},VERIFICATION_EMAIL:{limit:3,windowMs:3600000,spacingMs:60000},VERIFICATION_IP:{limit:10,windowMs:3600000},FORGOT_PASSWORD_EMAIL:{limit:3,windowMs:3600000},FORGOT_PASSWORD_IP:{limit:10,windowMs:3600000},PASSWORD_RESET_TOKEN:{limit:5,windowMs:900000},PASSWORD_RESET_IP:{limit:20,windowMs:900000}};
const key=(k:AuthRateLimitKind,v:string)=>createHash("sha256").update(`aura-auth-rate-limit:v1:${k}:${v}`).digest("hex");
export const normalizedEmailKey=(v:string)=>normalizeEmail(v);
export async function checkAuthRateLimit(k:AuthRateLimitKind,v:string,now=new Date(),r:AuthRateLimitRepository=repo){const p=policy[k];return r.attempt({keyHash:key(k,v),kind:k,limit:p.limit,windowMs:p.windowMs,minimumSpacingMs:p.spacingMs,now});}
export async function authRateLimitExceeded(k:AuthRateLimitKind,v:string,now=new Date(),r:AuthRateLimitRepository=repo){const d=await r.current({keyHash:key(k,v),kind:k,now});const p=policy[k];return Boolean(d&&(d.count>=p.limit||(p.spacingMs&&d.lastAttemptAt&&now.getTime()-d.lastAttemptAt.getTime()<p.spacingMs)));}
export const rateLimitHeaders=(r:{retryAfterSeconds:number})=>({"Retry-After":String(r.retryAfterSeconds),"Cache-Control":"private, no-store"});
