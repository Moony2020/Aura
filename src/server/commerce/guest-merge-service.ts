import "server-only";

import { ObjectId, type ClientSession, type Document } from "mongodb";

import type { Cart, CartLine } from "@/domain/cart/cart.schema";
import type { Wishlist } from "@/domain/wishlist/wishlist.schema";
import { conflictError, ownershipError, validationError } from "@/lib/errors/aura-error";
import { mongoClientPromise, getMongoDb } from "@/server/db/mongodb";
import { loadUserSessionAuthority, type SessionAuthority } from "@/server/auth/session-authority";
import { hashGuestCartToken, isPlausibleGuestCartToken } from "@/server/cart/guest-cart-token";
import { hashGuestWishlistToken, isPlausibleGuestWishlistToken } from "@/server/wishlist/guest-wishlist-token";

type MergeResult = { status: "MERGED" | "NOOP"; importedCount: number };
type CartDocument = Omit<Cart, "id"> & { _id: ObjectId };
type WishlistDocument = Omit<Wishlist, "id"> & { _id: ObjectId };

async function requireFreshAuthority(authority: SessionAuthority | null): Promise<SessionAuthority> {
  if (!authority) throw ownershipError();
  const current = await loadUserSessionAuthority(authority.user.id);
  if (!current || current.credentials.sessionVersion !== authority.credentials.sessionVersion) throw ownershipError();
  if (current.user.status !== "ACTIVE" || current.user.emailVerifiedAt === null) throw ownershipError();
  return current;
}

function requireToken(token: string | null | undefined, plausible: (value: string | null | undefined) => value is string): string {
  if (!plausible(token)) throw validationError("Invalid guest ownership token.");
  return token;
}

async function validateCartLines(lines: CartLine[], session: ClientSession): Promise<void> {
  const db = await getMongoDb();
  for (const line of lines) {
    const product = await db.collection<Document>("products").findOne({ _id: new ObjectId(line.productId), status: "PUBLISHED" }, { session });
    const variant = product?.variants?.find((entry: Document) => entry.id === line.variantId && entry.isActive === true);
    if (!variant) throw conflictError("Cart merge contains an unavailable product or variant.");
    const inventory = await db.collection<Document>("inventory").findOne({ variantId: line.variantId }, { session });
    if (!inventory || inventory.available <= 0 || line.quantity > inventory.available) throw conflictError("Cart merge exceeds current availability.");
  }
}

export async function mergeGuestCartForAuthority(authority: SessionAuthority | null, guestToken: string | null | undefined): Promise<MergeResult> {
  const current = await requireFreshAuthority(authority);
  const token = requireToken(guestToken, isPlausibleGuestCartToken);
  const db = await getMongoDb();
  const session = (await mongoClientPromise).startSession();
  let result: MergeResult = { status: "NOOP", importedCount: 0 };
  try {
    await session.withTransaction(async () => {
      const guest = await db.collection<CartDocument>("carts").findOne({ "owner.kind": "GUEST", "owner.guestTokenHash": hashGuestCartToken(token), status: "ACTIVE" }, { session });
      if (!guest) return;
      const user = await db.collection<CartDocument>("carts").findOne({ "owner.kind": "USER", "owner.userId": current.user.id, status: "ACTIVE" }, { session });
      const merged = new Map<string, CartLine>();
      for (const line of user?.items ?? []) merged.set(`${line.productId}:${line.variantId}`, line);
      for (const line of guest.items) {
        const key = `${line.productId}:${line.variantId}`;
        const existing = merged.get(key);
        merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line);
      }
      const items = [...merged.values()];
      await validateCartLines(items, session);
      const now = new Date();
      if (user) {
        const updated = await db.collection<CartDocument>("carts").findOneAndUpdate({ _id: user._id, status: "ACTIVE", "owner.kind": "USER", "owner.userId": current.user.id, version: user.version }, { $set: { items, updatedAt: now }, $inc: { version: 1 } }, { session, returnDocument: "after" });
        if (!updated) throw conflictError("Authenticated Cart changed during merge.");
      } else if (items.length > 0) {
        await db.collection<CartDocument>("carts").insertOne({ _id: new ObjectId(), owner: { kind: "USER", userId: current.user.id }, status: "ACTIVE", items, version: 0, createdAt: now, updatedAt: now }, { session });
      }
      const retired = await db.collection<CartDocument>("carts").updateOne({ _id: guest._id, status: "ACTIVE", "owner.kind": "GUEST", "owner.guestTokenHash": hashGuestCartToken(token) }, { $set: { status: "CONVERTED", updatedAt: now } }, { session });
      if (retired.modifiedCount !== 1) throw conflictError("Guest Cart changed during merge.");
      result = { status: "MERGED", importedCount: guest.items.length };
    });
  } finally { await session.endSession(); }
  return result;
}

export async function mergeGuestWishlistForAuthority(authority: SessionAuthority | null, guestToken: string | null | undefined): Promise<MergeResult> {
  const current = await requireFreshAuthority(authority);
  const token = requireToken(guestToken, isPlausibleGuestWishlistToken);
  const db = await getMongoDb();
  const session = (await mongoClientPromise).startSession();
  let result: MergeResult = { status: "NOOP", importedCount: 0 };
  try {
    await session.withTransaction(async () => {
      const guest = await db.collection<WishlistDocument>("wishlists").findOne({ "owner.kind": "GUEST", "owner.guestTokenHash": hashGuestWishlistToken(token) }, { session });
      if (!guest) return;
      const user = await db.collection<WishlistDocument>("wishlists").findOne({ "owner.kind": "USER", "owner.userId": current.user.id }, { session });
      const seen = new Set((user?.items ?? []).map((item) => item.productId));
      const imported = guest.items.filter((item) => !seen.has(item.productId));
      const items = [...(user?.items ?? []), ...imported];
      const now = new Date();
      if (user) {
        const updated = await db.collection<WishlistDocument>("wishlists").findOneAndUpdate({ _id: user._id, "owner.kind": "USER", "owner.userId": current.user.id, version: user.version }, { $set: { items, updatedAt: now }, $inc: { version: 1 } }, { session, returnDocument: "after" });
        if (!updated) throw conflictError("Authenticated Wishlist changed during merge.");
      } else if (items.length > 0) {
        await db.collection<WishlistDocument>("wishlists").insertOne({ _id: new ObjectId(), owner: { kind: "USER", userId: current.user.id }, items, version: 0, createdAt: now, updatedAt: now }, { session });
      }
      const deleted = await db.collection<WishlistDocument>("wishlists").deleteOne({ _id: guest._id, "owner.kind": "GUEST", "owner.guestTokenHash": hashGuestWishlistToken(token) }, { session });
      if (deleted.deletedCount !== 1) throw conflictError("Guest Wishlist changed during merge.");
      result = { status: "MERGED", importedCount: imported.length };
    });
  } finally { await session.endSession(); }
  return result;
}
