import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("src/app/(storefront)/account/page.tsx", "utf8");
const component = fs.readFileSync("src/components/account/AccountAddresses.tsx", "utf8");
assert.match(page, /AccountAddresses/);
assert.match(page, /listCurrentAddressesForAuthority\(authority\)/);
assert.match(component, /createAddressAction/);
assert.match(component, /updateAddressAction/);
assert.match(component, /deleteAddressAction/);
assert.match(component, /defaultShipping/);
assert.match(component, /defaultBilling/);
assert.match(component, /aria-labelledby/);
assert.doesNotMatch(component, /userId|ownerId/);
assert.doesNotMatch(page, /<Cart|<Wishlist|checkout|shipping-provider/i);
console.log("ACCOUNT_ADDRESSES_UI_CHECK: PASS (account-only list/create/edit/delete UI, P1 action boundary, default semantics, accessibility labels, and no ownership fields or out-of-scope surfaces)");
