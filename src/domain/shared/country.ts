import { z } from "zod";
export const countryCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/);
export const normalizeCountryCode = (value: string) => value.trim().toUpperCase();
