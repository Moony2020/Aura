import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

export const fragranceNoteKindSchema = z.enum(["NOTE", "INGREDIENT", "ACCORD"]);
export const fragranceTaxonomyStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const fragranceNoteTierSchema = z.enum(["TOP", "HEART", "BASE"]);
export const FRAGRANCE_NOTE_TIER_ORDER = { TOP: 0, HEART: 1, BASE: 2 } as const;

const baseTaxonomySchema = z.object({
  slug: z.string().trim().toLowerCase().regex(slugPattern).max(160),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000).optional(),
  status: fragranceTaxonomyStatusSchema.default("DRAFT"),
});

export const fragranceNoteCreateSchema = baseTaxonomySchema.extend({ kind: fragranceNoteKindSchema });
export const fragranceFamilyCreateSchema = baseTaxonomySchema;
export const fragranceNoteSchema = fragranceNoteCreateSchema.extend({ id: z.string().regex(objectIdPattern), createdAt: z.date(), updatedAt: z.date() });
export const fragranceFamilySchema = fragranceFamilyCreateSchema.extend({ id: z.string().regex(objectIdPattern), createdAt: z.date(), updatedAt: z.date() });

export const productFragranceNoteSchema = z.object({
  productId: z.string().regex(objectIdPattern),
  noteId: z.string().regex(objectIdPattern),
  tier: fragranceNoteTierSchema,
  position: z.number().int().nonnegative(),
});
export const productFragranceFamilySchema = z.object({
  productId: z.string().regex(objectIdPattern),
  familyId: z.string().regex(objectIdPattern),
  position: z.number().int().nonnegative(),
});

export const productFragranceNotesInputSchema = z.object({ notes: z.array(productFragranceNoteSchema.omit({ productId: true })).max(100) }).superRefine(({ notes }, ctx) => {
  const pairs = new Set<string>(); const positions = new Set<string>();
  notes.forEach((note, index) => {
    const pair = `${note.noteId}:${note.tier}`; const position = `${note.tier}:${note.position}`;
    if (pairs.has(pair)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["notes", index], message: "A note may appear once per tier." });
    if (positions.has(position)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["notes", index, "position"], message: "Note positions must be unique within each tier." });
    pairs.add(pair); positions.add(position);
  });
});
export const productFragranceFamiliesInputSchema = z.object({ families: z.array(productFragranceFamilySchema.omit({ productId: true })).max(50) }).superRefine(({ families }, ctx) => {
  const ids = new Set<string>(); const positions = new Set<number>();
  families.forEach((family, index) => { if (ids.has(family.familyId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["families", index, "familyId"], message: "A family may appear only once." }); if (positions.has(family.position)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["families", index, "position"], message: "Family positions must be unique." }); ids.add(family.familyId); positions.add(family.position); });
});

export type FragranceNote = z.output<typeof fragranceNoteSchema>;
export type FragranceFamily = z.output<typeof fragranceFamilySchema>;
export type FragranceNoteCreateInput = z.input<typeof fragranceNoteCreateSchema>;
export type FragranceFamilyCreateInput = z.input<typeof fragranceFamilyCreateSchema>;
export type ProductFragranceNote = z.output<typeof productFragranceNoteSchema>;
export type ProductFragranceFamily = z.output<typeof productFragranceFamilySchema>;
