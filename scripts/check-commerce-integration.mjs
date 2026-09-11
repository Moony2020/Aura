import { spawnSync } from "node:child_process";

const node = process.execPath;
const loader = ["--experimental-strip-types", "--loader", "./scripts/server-only-loader.mjs"];
const checks = [
  ["db:carts:init", ["--experimental-strip-types", "scripts/initialize-cart-collection.mjs"]],
  ["db:wishlists:init", [...loader, "scripts/initialize-wishlist-collection.mjs"]],
  ["db:discounts:init", [...loader, "scripts/initialize-discount-collection.mjs"]],
  ["db:gift-cards:init", [...loader, "scripts/initialize-gift-card-collections.mjs"]],
  ["db:carts:check", ["--experimental-strip-types", "scripts/check-cart-collection.mjs"]],
  ["db:wishlists:check", [...loader, "scripts/check-wishlist-collection.mjs"]],
  ["db:discounts:check", [...loader, "scripts/check-discount-collection.mjs"]],
  ["db:gift-cards:check", [...loader, "scripts/check-gift-card-collections.mjs"]],
  ["domain:cart", ["--experimental-strip-types", "scripts/check-cart-domain.mjs"]],
  ["domain:cart:persistence", [...loader, "scripts/check-cart-persistence.mjs"]],
  ["domain:cart:inventory", [...loader, "scripts/check-cart-inventory.mjs"]],
  ["domain:cart:drawer", ["scripts/check-cart-drawer.mjs"]],
  ["domain:cart:page", ["scripts/check-cart-page.mjs"]],
  ["domain:wishlist", ["--experimental-strip-types", "scripts/check-wishlist-domain.mjs"]],
  ["domain:discount", ["--experimental-strip-types", "scripts/check-discount-domain.mjs"]],
  ["domain:discount:evaluation", [...loader, "scripts/check-discount-evaluation.mjs"]],
  ["domain:gift-card", ["--experimental-strip-types", "scripts/check-gift-card-domain.mjs"]],
  ["domain:gift-card:balance", [...loader, "scripts/check-gift-card-balance.mjs"]],
  ["domain:gift-card:integration", [...loader, "scripts/check-gift-card-integration.mjs"]],
  ["domain:cinematic:mappings", ["scripts/check-cinematic-seed.mjs"]],
  ["domain:cinematic:cart", [...loader, "scripts/check-cinematic-cart-integration.mjs"]],
  ["domain:commerce:architecture", ["scripts/check-commerce-architecture.mjs"]],
  ["domain:foundation", ["scripts/check-foundation-integration.mjs"]],
  ["domain:product:detail", ["--experimental-strip-types", "scripts/check-product-detail.mjs"]],
  ["domain:storefront:navigation", ["scripts/check-storefront-navigation.mjs"]],
  ["domain:storefront:responsive", ["scripts/check-storefront-responsive-accessibility.mjs"]],
];

let failed = 0;
for (const [name, args] of checks) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(node, args, { stdio: "inherit", env: process.env, windowsHide: true });
  if (result.error || result.status !== 0) {
    failed += 1;
    console.error(`${name}: FAIL (exit=${result.status ?? "spawn"})`);
  }
}

console.log(`\nCOMMERCE_INTEGRATION_SUITE: ${failed === 0 ? "PASS" : `FAIL (${failed} checks)`}`);
process.exitCode = failed === 0 ? 0 : 1;

