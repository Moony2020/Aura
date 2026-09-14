import assert from "node:assert/strict";
import fs from "node:fs";

const actions = fs.readFileSync("src/server/auth/actions.ts", "utf8");
const orchestration = fs.readFileSync("src/server/auth/post-login-merge.ts", "utf8");
const handoff = fs.readFileSync("src/app/(storefront)/auth/post-login/route.ts", "utf8");
const auth = fs.readFileSync("auth.ts", "utf8");
const layouts = ["src/app/layout.tsx", "src/app/(storefront)/layout.tsx"].map((path) => fs.readFileSync(path, "utf8")).join("\n");

assert.match(actions, /signIn\([\s\S]*?redirect:\s*false/);
assert.match(actions, /redirect\(`\/auth\/post-login\?callbackUrl=/);
assert.doesNotMatch(actions, /runPostLoginGuestMerge/);
assert.match(handoff, /runPostLoginGuestMerge/);
assert.match(handoff, /getCurrentSessionAuthority/);
assert.match(orchestration, /cookies\(\)/);
assert.match(orchestration, /GUEST_CART_COOKIE_NAME/);
assert.match(orchestration, /GUEST_WISHLIST_COOKIE_NAME/);
assert.match(orchestration, /mergeGuestCartForAuthority/);
assert.match(orchestration, /mergeGuestWishlistForAuthority/);
assert.match(orchestration, /buildExpiredGuestCartCookie/);
assert.match(orchestration, /buildExpiredGuestWishlistCookie/);
assert.match(orchestration, /post-login-cart-merge/);
assert.match(orchestration, /post-login-wishlist-merge/);
assert.doesNotMatch(auth, /mergeGuest|postLoginGuestMerge/);
assert.doesNotMatch(layouts, /mergeGuest|postLoginGuestMerge|GUEST_CART_COOKIE_NAME|GUEST_WISHLIST_COOKIE_NAME/);
assert.doesNotMatch(orchestration, /guestCartToken|guestWishlistToken|guestOwnerHash|ownerId|userId\s*:/);

console.log("STAGE48_P2_STATIC_CHECK: PASS (post-login orchestration, independent cookie lifecycle, safe redirect, and no recurring/global merge hook)");
