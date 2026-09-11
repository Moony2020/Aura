import { z } from "zod";
export const safeTextSchema = (max = 4000) => z.string().trim().min(1).max(max);
export const optionalSafeTextSchema = (max = 4000) => z.string().trim().max(max).optional();
