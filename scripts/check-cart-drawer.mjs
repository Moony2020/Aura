import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const mustInclude = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label} missing: ${token}`);
};
const mustNotInclude = (source, token, label) => {
  if (source.includes(token)) throw new Error(`${label} must not include: ${token}`);
};

const header = read("src/components/storefront/StorefrontHeaderShell.tsx");
const drawer = read("src/components/storefront/StorefrontCartAction.tsx");
const actions = read("src/server/cart/cart-actions.ts");
const service = read("src/server/cart/cart-service.ts");
const styles = read("src/app/globals.css");
const packageJson = read("package.json");

mustInclude(header, "<StorefrontCartAction", "Header cart action");
mustNotInclude(header, "cookies(", "Storefront header server component");
mustNotInclude(header, "readCurrentCartAction", "Storefront header server component");

for (const token of [
  '"use client"',
  'aria-label="Open shopping bag"',
  "aria-haspopup=\"dialog\"",
  "aria-expanded={isOpen}",
  "aria-controls={drawerId}",
  "role=\"dialog\"",
  "aria-modal=\"true\"",
  "storefront-cart-layer__backdrop",
  "Close shopping bag",
  "document.body.style.overflow = \"hidden\"",
  "window.scrollTo(0, previousScrollY)",
  "trigger?.focus()",
  "event.key === \"Escape\"",
  "event.key !== \"Tab\"",
  "readCurrentCartAction()",
  "removeCartItemAction",
  "updateCartItemQuantityAction",
  "clearCartAction",
  "formatMinorUnitMoney",
  "Online availability currently unavailable",
  "cart-quantity-stepper",
  "Decrease ${item.productName} quantity",
  "Increase ${item.productName} quantity",
  "Your bag changed in another tab",
  "const hasItems = cart.items.length > 0",
]) mustInclude(drawer, token, "Cart drawer client boundary");

for (const forbidden of [
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "reserve(",
  "release(",
  "commit(",
  "Stripe(",
  "paypal",
  "href=\"/checkout\"",
  "Add to Bag",
  "addToBag",
]) mustNotInclude(drawer, forbidden, "Cart drawer client boundary");

mustInclude(drawer, 'href="/cart"', "Cart drawer View Bag link");

for (const token of [
  '"use server"',
  "cookies",
  "GUEST_CART_COOKIE_NAME",
  "createCartService()",
  "readCurrentCart",
  "removeItem",
  "clearCart",
  "parseCartLineId",
  "serializePublicError",
]) mustInclude(actions, token, "Cart server actions");

for (const forbidden of [
  "guestTokenHash:",
  "ownerId",
  "cartId",
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "Stripe(",
  "paypal",
]) mustNotInclude(actions, forbidden, "Cart server actions");

for (const token of [
  "lineId",
  "encodeCartLineId",
  "parseCartLineId",
]) mustInclude(service, token, "Cart view model line identity");

for (const token of [
  ".storefront-cart-layer",
  ".storefront-cart-drawer",
  "100dvh",
  "env(safe-area-inset",
  "@media (prefers-reduced-motion: reduce)",
  "@media (max-width: 520px)",
]) mustInclude(styles, token, "Cart drawer styles");

mustInclude(packageJson, "domain:cart:drawer:check", "package script");

const sourceRoots = ["src"];
const scan = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = `${directory}/${entry.name}`;
  if (entry.isDirectory()) return scan(path);
  return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [path] : [];
});

for (const file of sourceRoots.flatMap(scan)) {
  const source = read(file);
  mustNotInclude(source, "server-only-loader", `${file} production source`);
}

console.log("PASS: Cart drawer keeps cart UI isolated, accessible, service-backed, quantity-aware, and free of checkout/cinematic scope.");
