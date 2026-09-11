import fs from "node:fs";
if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}
const { getMongoDb } = await import("../src/server/db/mongodb.ts");
const db = await getMongoDb();
const collections = await db.listCollections({ name: "wishlists" }).toArray();
if (!collections.length) throw new Error("wishlists collection is not initialized");
const indexes = await db.collection("wishlists").indexes();
for (const name of ["unique_active_guest_wishlist_owner", "unique_user_wishlist_owner"]) if (!indexes.some((index) => index.name === name)) throw new Error(`Missing wishlist index: ${name}`);
console.log("Wishlist collection and indexes verified.");
process.exit(0);
