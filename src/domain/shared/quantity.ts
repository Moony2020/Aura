import { z } from "zod";
export const quantitySchema = z.number().int().positive();
export const nonnegativeQuantitySchema = z.number().int().nonnegative();
