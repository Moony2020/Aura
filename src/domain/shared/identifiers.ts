import { z } from "zod";
export const objectIdPattern = /^[a-f\d]{24}$/i;
export const uuidSchema = z.string().uuid();
export const objectIdSchema = z.string().regex(objectIdPattern);
export const normalizeObjectId = (value: string) => value.trim().toLowerCase();
