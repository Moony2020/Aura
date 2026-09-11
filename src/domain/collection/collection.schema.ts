import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

export const collectionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const collectionVisibilitySchema = z.enum(["PUBLIC", "HIDDEN"]);
export const collectionMediaKindSchema = z.enum(["IMAGE", "VIDEO"]);
export const collectionMediaProviderSchema = z.enum(["CLOUDINARY", "EXTERNAL"]);

export const collectionMembershipSchema = z.object({
  productId: z.string().regex(objectIdPattern),
  position: z.number().int().nonnegative(),
});

export const collectionMediaSchema = z.object({
  id: z.string().uuid(),
  kind: collectionMediaKindSchema,
  provider: collectionMediaProviderSchema,
  url: z.string().url(),
  alt: z.string().trim().min(1).max(240),
  position: z.number().int().nonnegative(),
  publicId: z.string().trim().min(1).max(240).optional(),
});

export const collectionCreateSchema = z
  .object({
    slug: z.string().trim().toLowerCase().regex(slugPattern).max(160),
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(4_000),
    status: collectionStatusSchema.default("DRAFT"),
    visibility: collectionVisibilitySchema.default("HIDDEN"),
    productMemberships: z.array(collectionMembershipSchema).max(500).default([]),
    campaignMedia: z.array(collectionMediaSchema).max(100).default([]),
  })
  .superRefine((collection, context) => {
    const productIds = new Set<string>();
    const positions = new Set<number>();
    collection.productMemberships.forEach((membership, index) => {
      if (productIds.has(membership.productId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["productMemberships", index, "productId"], message: "A product may appear only once in a collection." });
      }
      productIds.add(membership.productId);
      if (positions.has(membership.position)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["productMemberships", index, "position"], message: "Collection membership positions must be unique." });
      }
      positions.add(membership.position);
    });
    const mediaIds = new Set<string>();
    const mediaPositions = new Set<number>();
    collection.campaignMedia.forEach((media, index) => {
      if (mediaIds.has(media.id) || mediaPositions.has(media.position)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["campaignMedia", index], message: "Campaign media IDs and positions must be unique." });
      }
      mediaIds.add(media.id);
      mediaPositions.add(media.position);
    });
    if (collection.status === "PUBLISHED" && collection.visibility === "PUBLIC" && collection.productMemberships.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["productMemberships"], message: "A public published collection must contain at least one product membership." });
    }
  });

export const collectionSchema = z.intersection(
  collectionCreateSchema,
  z.object({ id: z.string().regex(objectIdPattern), createdAt: z.date(), updatedAt: z.date() }),
);

export type CollectionCreateInput = z.input<typeof collectionCreateSchema>;
export type Collection = z.output<typeof collectionSchema>;
