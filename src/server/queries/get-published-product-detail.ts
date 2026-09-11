import "server-only";

import type { PublicError } from "@/lib/errors/serialize";
import { serializePublicError } from "@/lib/errors/serialize";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";
import { MongoFragranceFamilyRepository, MongoFragranceNoteRepository, MongoProductFragranceTaxonomyRepository } from "@/server/repositories/mongo-fragrance-repository";
import { MongoInventoryRepository } from "@/server/repositories/mongo-order-inventory-repository";
import { MongoProductRepository } from "@/server/repositories/mongo-product-repository";

export type ProductDetailVariant = { id: string; sku: string; name: string; volumeMl: number; concentration: string; price: { amount: number; currency: string }; availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNTRACKED" };
export type ProductDetailMedia = { id: string; kind: "IMAGE" | "VIDEO"; url: string; alt: string; posterUrl?: string };
export type ProductDetailNote = { tier: "TOP" | "HEART" | "BASE"; position: number; name: string; kind: "NOTE" | "INGREDIENT" | "ACCORD" };
export type ProductDetail = { slug: string; name: string; brand: string; description: string; audience: "WOMEN" | "MEN" | "UNISEX" | null; family: string | null; collection: string | null; media: ProductDetailMedia[]; variants: ProductDetailVariant[]; notes: ProductDetailNote[] };
export type ProductDetailResult = { product: ProductDetail | null; error: PublicError | null };

const posterFor = (media: ProductDetailMedia): ProductDetailMedia => media.kind === "VIDEO" && media.url.includes("res.cloudinary.com") ? { ...media, posterUrl: media.url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.(mp4|mov|webm)(\?.*)?$/i, ".jpg$2") } : media;

export async function getPublishedProductDetail(slug: string): Promise<ProductDetailResult> {
  try {
    const product = await new MongoProductRepository().findBySlug(slug);
    if (!product || product.status !== "PUBLISHED") return { product: null, error: null };
    const taxonomy = new MongoProductFragranceTaxonomyRepository();
    const [families, familyLinks, noteLinks, collections] = await Promise.all([
      new MongoFragranceFamilyRepository(), taxonomy.listProductFamilies(product.id), taxonomy.listProductNotes(product.id), new MongoCollectionRepository().listVisible(),
    ]);
    const familyRows = await families.findByIds(familyLinks.map((link) => link.familyId));
    const notes = await new MongoFragranceNoteRepository().findByIds(noteLinks.map((link) => link.noteId));
    const noteById = new Map(notes.filter((note) => note.status === "PUBLISHED").map((note) => [note.id, note]));
    const familyById = new Map(familyRows.filter((family) => family.status === "PUBLISHED").map((family) => [family.id, family]));
    const collection = collections.find((entry) => entry.productMemberships.some((membership) => membership.productId === product.id));
    const inventory = new MongoInventoryRepository();
    const variants = await Promise.all(product.variants.filter((variant) => variant.isActive).map(async (variant) => {
      const stock = await inventory.getByVariantId(variant.id);
      return { id: variant.id, sku: variant.sku, name: variant.name, volumeMl: variant.volumeMl, concentration: variant.concentration, price: variant.price, availability: stock ? (stock.available > 0 ? "AVAILABLE" : "OUT_OF_STOCK") : "UNTRACKED" } satisfies ProductDetailVariant;
    }));
    return { product: { slug: product.slug, name: product.name, brand: product.brand, description: product.description, audience: product.audience ?? null, family: familyById.get(familyLinks[0]?.familyId ?? "")?.name ?? null, collection: collection?.name ?? null, media: product.media.slice().sort((a, b) => a.position - b.position).map((media) => posterFor({ id: media.id, kind: media.kind, url: media.url, alt: media.alt })), variants, notes: noteLinks.slice().sort((a, b) => (a.tier === b.tier ? a.position - b.position : ["TOP", "HEART", "BASE"].indexOf(a.tier) - ["TOP", "HEART", "BASE"].indexOf(b.tier))).map((link) => { const note = noteById.get(link.noteId); return note ? { tier: link.tier, position: link.position, name: note.name, kind: note.kind } : null; }).filter((note): note is ProductDetailNote => Boolean(note)) }, error: null };
  } catch (error) {
    return { product: null, error: serializePublicError(error) };
  }
}
