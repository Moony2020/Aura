import { z } from "zod";
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);
export const moneySchema = z.object({ amount: z.number().int().nonnegative(), currency: currencyCodeSchema });
export const minorUnitSchema = z.number().int().nonnegative();
