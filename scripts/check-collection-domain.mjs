import { collectionCreateSchema } from "../src/domain/collection/collection.schema.ts";

const productId = "0123456789abcdef01234567";
const base = { slug: "signature-collection", name: "Signature", description: "A valid collection contract.", status: "DRAFT", visibility: "HIDDEN", campaignMedia: [] };
const duplicateProduct = collectionCreateSchema.safeParse({ ...base, productMemberships: [{ productId, position: 0 }, { productId, position: 1 }] });
const duplicatePosition = collectionCreateSchema.safeParse({ ...base, productMemberships: [{ productId, position: 0 }, { productId: "89abcdef0123456701234567", position: 0 }] });
const emptyPublic = collectionCreateSchema.safeParse({ ...base, status: "PUBLISHED", visibility: "PUBLIC", productMemberships: [] });
const validDraft = collectionCreateSchema.safeParse({ ...base, productMemberships: [{ productId, position: 0 }] });
if (duplicateProduct.success || duplicatePosition.success || emptyPublic.success || !validDraft.success) { console.error("COLLECTION_DOMAIN_CONTRACT_CHECK: FAIL"); process.exitCode = 1; } else { console.log("COLLECTION_DOMAIN_CONTRACT_CHECK: PASS"); }
