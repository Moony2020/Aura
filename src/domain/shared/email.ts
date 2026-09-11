import { z } from "zod";
export const emailSchema = z.string().trim().email().max(320);
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
