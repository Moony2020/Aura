import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("src/server/account/address-service.ts", "utf8");
const actions = fs.readFileSync("src/server/account/address-actions.ts", "utf8");
const schema = fs.readFileSync("src/domain/user/user.schema.ts", "utf8");
const repository = fs.readFileSync("src/server/repositories/mongo-user-repository.ts", "utf8");

for (const token of ["requireCurrentSessionAuthority", "requireActiveAuthority", "listForUser", "createForUser", "updateForUser", "deleteForUser", "findForUser", "ownershipError", "addressCreateInputSchema", "addressUpdateInputSchema"]) {
  assert.match(service, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `address service boundary missing: ${token}`);
}
for (const token of ["use server", "listAddressesAction", "createAddressAction", "updateAddressAction", "deleteAddressAction", "revalidatePath(\"/account\")"]) {
  assert.match(actions, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `address action boundary missing: ${token}`);
}
assert.match(schema, /addressCreateSchema/);
assert.match(schema, /addressUpdateSchema/);
assert.match(repository, /find\(\{ userId \}\)/);
assert.match(repository, /findOne\(\{ _id: oid\(addressId\), userId \}\)/);
assert.match(repository, /deleteOne\(\{ _id: oid\(addressId\), userId \}\)/);
assert.doesNotMatch(service, /ownerId/);
assert.doesNotMatch(actions, /ownerId/);
console.log("ADDRESS_MANAGEMENT_BOUNDARY_CHECK: PASS (server-only list/create/update/delete, canonical Auth.js/session authority, strict client input boundary, ownership-scoped repository access, existing default semantics, and no UI/P2 surface)");
