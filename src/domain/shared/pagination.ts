import { z } from "zod";
export const paginationSchema = z.object({ page: z.number().int().positive().default(1), pageSize: z.number().int().positive().max(100).default(24) });
export const sortDirectionSchema = z.enum(["asc", "desc"]);
export const sortInputSchema = z.object({ field: z.string().trim().min(1).max(80), direction: sortDirectionSchema.default("asc") });
export const paginationOffset = (page: number, pageSize: number) => (page - 1) * pageSize;
