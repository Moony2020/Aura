import { z } from "zod";

import { objectIdSchema } from "../shared/identifiers.ts";
import { quantitySchema } from "../shared/quantity.ts";

export const cartStatusSchema = z.enum(["ACTIVE", "CONVERTED", "EXPIRED"]);
export const cartOwnerKindSchema = z.enum(["GUEST", "USER"]);

const guestTokenHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Guest token hashes must be SHA-256 lowercase hexadecimal digests.");

export const guestCartOwnerSchema = z
  .object({
    kind: z.literal("GUEST"),
    guestTokenHash: guestTokenHashSchema,
    userId: z.never().optional(),
  })
  .strict();

export const userCartOwnerSchema = z
  .object({
    kind: z.literal("USER"),
    userId: objectIdSchema,
    guestTokenHash: z.never().optional(),
  })
  .strict();

export const cartOwnerSchema = z.discriminatedUnion("kind", [
  guestCartOwnerSchema,
  userCartOwnerSchema,
]);

export const cartLineSchema = z
  .object({
    productId: objectIdSchema,
    variantId: z.string().uuid(),
    quantity: quantitySchema,
  })
  .strict();

const cartBaseSchema = z
  .object({
    owner: cartOwnerSchema,
    status: cartStatusSchema.default("ACTIVE"),
    items: z.array(cartLineSchema).max(100).default([]),
    version: z.number().int().nonnegative().default(0),
    expiresAt: z.date().optional(),
  })
  .strict();

function enforceCartInvariants(
  cart: z.output<typeof cartBaseSchema>,
  context: z.RefinementCtx,
) {
  if (cart.owner.kind === "GUEST" && !cart.expiresAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Guest carts require an expiration timestamp.",
    });
  }

  const lineKeys = new Set<string>();
  cart.items.forEach((item, index) => {
    const key = `${item.productId}:${item.variantId}`;
    if (lineKeys.has(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items", index, "variantId"],
        message: "A cart cannot contain duplicate product/variant lines.",
      });
    }
    lineKeys.add(key);
  });
}

export const cartCreateSchema = cartBaseSchema.superRefine(enforceCartInvariants);

export const cartSchema = cartBaseSchema
  .extend({
    id: objectIdSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine(enforceCartInvariants);

export type Cart = z.output<typeof cartSchema>;
export type CartCreateInput = z.input<typeof cartCreateSchema>;
export type CartOwner = z.output<typeof cartOwnerSchema>;
export type CartStatus = z.output<typeof cartStatusSchema>;
export type CartLine = z.output<typeof cartLineSchema>;
