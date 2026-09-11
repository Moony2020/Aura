import { z } from "zod";

import { objectIdSchema } from "../shared/identifiers.ts";

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const wishlistItemSchema = z.object({
  productId: objectIdSchema,
  addedAt: z.date(),
}).strict();

export const wishlistOwnerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("GUEST"), guestTokenHash: hashSchema, userId: z.never().optional() }).strict(),
  z.object({ kind: z.literal("USER"), userId: objectIdSchema, guestTokenHash: z.never().optional() }).strict(),
]);

const base = z.object({
  owner: wishlistOwnerSchema,
  items: z.array(wishlistItemSchema).max(500).default([]),
  version: z.number().int().nonnegative().default(0),
  expiresAt: z.date().optional(),
}).strict();

function invariants(value: z.output<typeof base>, ctx: z.RefinementCtx) {
  if (value.owner.kind === "GUEST" && !value.expiresAt) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Guest wishlists require expiration." });
  const seen = new Set<string>();
  value.items.forEach((item, index) => {
    if (seen.has(item.productId)) ctx.addIssue({ code: "custom", path: ["items", index, "productId"], message: "Duplicate products are not allowed." });
    seen.add(item.productId);
  });
}

export const wishlistCreateSchema = base.superRefine(invariants);
export const wishlistSchema = base.extend({ id: objectIdSchema, createdAt: z.date(), updatedAt: z.date() }).superRefine(invariants);
export type Wishlist = z.output<typeof wishlistSchema>;
export type WishlistCreateInput = z.input<typeof wishlistCreateSchema>;
export type WishlistItem = z.output<typeof wishlistItemSchema>;
export type WishlistOwner = z.output<typeof wishlistOwnerSchema>;
