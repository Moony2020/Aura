import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const productAudienceSchema = z.enum(["WOMEN", "MEN", "UNISEX"]);
export const productConcentrationSchema = z.enum([
  "EAU_DE_TOILETTE",
  "EAU_DE_PARFUM",
  "EAU_DE_PARFUM_INTENSE",
  "EXTRAIT_DE_PARFUM",
  "PARFUM",
]);
export const productMediaKindSchema = z.enum(["IMAGE", "VIDEO"]);
export const productMediaProviderSchema = z.enum(["CLOUDINARY", "EXTERNAL"]);

export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const productMediaSchema = z.object({
  id: z.string().uuid(),
  kind: productMediaKindSchema,
  provider: productMediaProviderSchema,
  url: z.string().trim().min(1).refine(
    (value) => value.startsWith("/") || z.string().url().safeParse(value).success,
    { message: "Media URL must be an absolute URL or a root-relative path." }
  ),
  alt: z.string().trim().min(1).max(240),
  position: z.number().int().nonnegative(),
  publicId: z.string().trim().min(1).max(240).optional(),
});

export const productVariantSchema = z
  .object({
    id: z.string().uuid(),
    sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{2,63}$/),
    name: z.string().trim().min(1).max(120),
    volumeMl: z.number().int().positive(),
    concentration: productConcentrationSchema,
    price: moneySchema,
    compareAtPrice: moneySchema.optional(),
    isActive: z.boolean(),
  })
  .superRefine((variant, context) => {
    if (
      variant.compareAtPrice &&
      (variant.compareAtPrice.currency !== variant.price.currency ||
        variant.compareAtPrice.amount < variant.price.amount)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compareAtPrice"],
        message:
          "The compare-at price must use the variant currency and be greater than or equal to the selling price.",
      });
    }
  });

export const productCreateSchema = z
  .object({
    slug: z.string().trim().toLowerCase().regex(slugPattern).max(160),
    name: z.string().trim().min(1).max(160),
    brand: z.string().trim().min(1).max(120).default("AURA"),
    description: z.string().trim().min(1).max(4_000),
    status: productStatusSchema.default("DRAFT"),
    audience: productAudienceSchema.optional(),
    launchAt: z.date().optional(),
    variants: z.array(productVariantSchema).min(1).max(50),
    media: z.array(productMediaSchema).max(100).default([]),
    primaryMediaId: z.string().uuid().optional(),
  })
  .superRefine((product, context) => {
    const variantSkus = new Set<string>();
    const variantIds = new Set<string>();

    product.variants.forEach((variant, index) => {
      if (variantSkus.has(variant.sku)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "sku"],
          message: "Variant SKUs must be unique within a product.",
        });
      }
      variantSkus.add(variant.sku);

      if (variantIds.has(variant.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "id"],
          message: "Variant IDs must be unique within a product.",
        });
      }
      variantIds.add(variant.id);
    });

    const mediaIds = new Set<string>();
    const mediaPositions = new Set<number>();
    product.media.forEach((media, index) => {
      if (mediaIds.has(media.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["media", index, "id"],
          message: "Media IDs must be unique within a product.",
        });
      }
      mediaIds.add(media.id);

      if (mediaPositions.has(media.position)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["media", index, "position"],
          message: "Media positions must be unique within a product.",
        });
      }
      mediaPositions.add(media.position);
    });

    if (product.primaryMediaId && !mediaIds.has(product.primaryMediaId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryMediaId"],
        message: "The primary media ID must reference product media.",
      });
    }
  });

export const productSchema = z.intersection(
  productCreateSchema,
  z.object({
    id: z.string().regex(objectIdPattern),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type ProductCreateInput = z.input<typeof productCreateSchema>;
export type Product = z.output<typeof productSchema>;
export type ProductAudience = z.output<typeof productAudienceSchema>;
