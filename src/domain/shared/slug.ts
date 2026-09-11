import { z } from "zod";
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z.string().trim().toLowerCase().regex(slugPattern).max(160);
export const normalizeSlug = (value: string) => value.trim().toLowerCase();
