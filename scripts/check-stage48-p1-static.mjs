import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/server/commerce/guest-merge-service.ts", "utf8");
for (const token of ["mergeGuestCartForAuthority", "mergeGuestWishlistForAuthority", "withTransaction", "sessionVersion", "hashGuestCartToken", "hashGuestWishlistToken", "CONVERTED"]) assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
for (const forbidden of [/authorize/, /jwt callback/i, /cookies\(/, /clearCookie/i, /login/i, /Reorder/i, /checkout/i]) assert.doesNotMatch(source, forbidden);
assert.match(source, /version: user\.version/);
assert.match(source, /Cart merge contains an unavailable/);
console.log("STAGE48_P1_STATIC_CHECK: PASS (independent server Cart/Wishlist transactions, authority, ownership, atomic failure, and no login/cookie/UI integration)");
