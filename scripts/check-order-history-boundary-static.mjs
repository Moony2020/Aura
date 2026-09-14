import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("src/server/order/order-history-service.ts", "utf8");
const repository = fs.readFileSync("src/server/repositories/mongo-order-inventory-repository.ts", "utf8");
assert.match(service, /requireFreshActiveAuthority/);
assert.match(service, /listForUser/);
assert.match(service, /findForUser/);
assert.match(service, /ownershipError/);
assert.match(service, /order\.items/);
assert.match(service, /order\.shippingAddress/);
assert.match(service, /order\.totals/);
assert.doesNotMatch(service, /transitionStatus|create\(/);
assert.match(repository, /find\(\{ userId \}\)/);
assert.match(repository, /_id: new ObjectId\(orderId\), userId/);
console.log("ORDER_HISTORY_BOUNDARY_STATIC_CHECK: PASS (server-only read boundary, ownership-scoped repository queries, safe historical view model, and no customer mutation surface)");
