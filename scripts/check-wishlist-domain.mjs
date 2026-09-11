import { wishlistCreateSchema } from "../src/domain/wishlist/wishlist.schema.ts";
const base = { owner: { kind: "GUEST", guestTokenHash: "a".repeat(64) }, items: [], version: 0, expiresAt: new Date() };
wishlistCreateSchema.parse(base);
try { wishlistCreateSchema.parse({ ...base, items: [{ productId: "507f1f77bcf86cd799439011", addedAt: new Date() }, { productId: "507f1f77bcf86cd799439011", addedAt: new Date() }] }); throw new Error("Duplicate wishlist products were accepted"); } catch (error) { if (error.message === "Duplicate wishlist products were accepted") throw error; }
console.log("Wishlist domain invariants verified.");
