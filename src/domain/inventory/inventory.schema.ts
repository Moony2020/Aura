import { z } from "zod";
const variantIdSchema = z.string().uuid();
const nonnegative = z.number().int().nonnegative();
export const inventorySchema = z.object({ variantId: variantIdSchema, sku: z.string().trim().toUpperCase().min(3).max(64), available: nonnegative, reserved: nonnegative, committed: nonnegative, version: nonnegative, updatedAt: z.date() });
export const inventoryCreateSchema = inventorySchema.omit({ updatedAt: true, version: true }).extend({ version: z.number().int().nonnegative().default(0), updatedAt: z.date().default(new Date()) });
export const inventoryReservationStatusSchema = z.enum(["ACTIVE", "RELEASED", "COMMITTED", "EXPIRED"]);
export const inventoryReservationSchema = z.object({ id: z.string().uuid(), orderId: z.string().regex(/^[a-f\d]{24}$/i).optional(), variantId: variantIdSchema, quantity: z.number().int().positive(), status: inventoryReservationStatusSchema, expiresAt: z.date(), createdAt: z.date(), updatedAt: z.date() });
export type Inventory = z.output<typeof inventorySchema>; export type InventoryCreateInput = z.input<typeof inventoryCreateSchema>; export type InventoryReservation = z.output<typeof inventoryReservationSchema>;
