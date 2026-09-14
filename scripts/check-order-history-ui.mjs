import assert from "node:assert/strict";
import fs from "node:fs";

const accountPage = fs.readFileSync("src/app/(storefront)/account/page.tsx", "utf8");
const orderUi = fs.readFileSync("src/components/account/AccountOrderHistory.tsx", "utf8");

for (const fragment of ["AccountOrderHistory", "listCurrentOrderHistory", "Suspense", "OrderHistorySkeleton"]) {
  assert.match(accountPage, new RegExp(fragment), `account integration must include ${fragment}`);
}
for (const fragment of ["order.items", "order.shippingAddress", "order.totals", "order.orderNumber", "<details", "No orders yet"]) {
  assert.match(orderUi, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `order UI must include ${fragment}`);
}
for (const forbidden of [/userId/, /customerId/, /ownerId/, /accountId/, /Reorder/i, /Add to Cart/i, /checkout/i, /transitionStatus/]) {
  assert.doesNotMatch(orderUi, forbidden, `customer order UI must not include ${forbidden}`);
}

console.log("ORDER_HISTORY_UI_STATIC_CHECK: PASS (Account integration, safe historical view rendering, read-only semantics, and empty/loading states)");
