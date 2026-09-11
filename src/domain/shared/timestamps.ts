import { z } from "zod";
export const timestampsSchema = z.object({ createdAt: z.date(), updatedAt: z.date() });
export const createdUpdatedNow = () => { const now = new Date(); return { createdAt: now, updatedAt: now }; };
export const isValidDateBoundary = (value: Date) => !Number.isNaN(value.getTime());
