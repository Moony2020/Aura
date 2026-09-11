import {
  cartCreateSchema,
  cartSchema,
} from "../src/domain/cart/cart.schema.ts";

const objectId = "507f1f77bcf86cd799439011";
const userId = "507f1f77bcf86cd799439012";
const variantId = "550e8400-e29b-41d4-a716-446655440000";
const hash = "a".repeat(64);
const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const validLine = { productId: objectId, variantId, quantity: 1 };

cartCreateSchema.parse({
  owner: { kind: "GUEST", guestTokenHash: hash },
  status: "ACTIVE",
  items: [],
  expiresAt: future,
});

cartCreateSchema.parse({
  owner: { kind: "USER", userId },
  status: "ACTIVE",
  items: [validLine],
});

cartSchema.parse({
  id: "507f1f77bcf86cd799439013",
  owner: { kind: "GUEST", guestTokenHash: hash },
  status: "CONVERTED",
  items: [validLine],
  version: 0,
  expiresAt: future,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mustReject = [
  {
    label: "guest owner without hash",
    value: { owner: { kind: "GUEST" }, items: [], expiresAt: future },
  },
  {
    label: "guest owner with user id",
    value: { owner: { kind: "GUEST", guestTokenHash: hash, userId }, items: [], expiresAt: future },
  },
  {
    label: "user owner without user id",
    value: { owner: { kind: "USER" }, items: [] },
  },
  {
    label: "user owner with guest hash",
    value: { owner: { kind: "USER", userId, guestTokenHash: hash }, items: [] },
  },
  {
    label: "guest without expiration",
    value: { owner: { kind: "GUEST", guestTokenHash: hash }, items: [] },
  },
  {
    label: "unsupported status",
    value: { owner: { kind: "USER", userId }, status: "ABANDONED", items: [] },
  },
  {
    label: "zero quantity",
    value: { owner: { kind: "USER", userId }, items: [{ ...validLine, quantity: 0 }] },
  },
  {
    label: "decimal quantity",
    value: { owner: { kind: "USER", userId }, items: [{ ...validLine, quantity: 1.5 }] },
  },
  {
    label: "duplicate line identity",
    value: { owner: { kind: "USER", userId }, items: [validLine, validLine] },
  },
  {
    label: "invalid product id",
    value: { owner: { kind: "USER", userId }, items: [{ ...validLine, productId: "bad" }] },
  },
  {
    label: "invalid version",
    value: { owner: { kind: "USER", userId }, items: [], version: -1 },
  },
  {
    label: "unexpected top-level field",
    value: { owner: { kind: "USER", userId }, items: [], subtotal: { amount: 100, currency: "USD" } },
  },
  {
    label: "commercial line snapshot",
    value: { owner: { kind: "USER", userId }, items: [{ ...validLine, unitPrice: { amount: 100, currency: "USD" } }] },
  },
];

for (const { label, value } of mustReject) {
  let rejected = false;
  try {
    cartCreateSchema.parse(value);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error(`Cart domain accepted invalid contract: ${label}`);
}

console.log("PASS: Cart domain owner, lifecycle, line identity, quantity, version, expiration, and no-snapshot invariants are enforced.");
