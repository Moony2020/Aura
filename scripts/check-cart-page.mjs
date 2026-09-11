import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const mustInclude = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label} missing: ${token}`);
};
const mustNotInclude = (source, token, label) => {
  if (source.includes(token)) throw new Error(`${label} must not include: ${token}`);
};

const pagePath = "src/app/(storefront)/cart/page.tsx";
const clientPath = "src/components/storefront/CartPageClient.tsx";
const page = read(pagePath);
const client = read(clientPath);
const drawer = read("src/components/storefront/StorefrontCartAction.tsx");
const styles = read("src/app/globals.css");
const packageJson = read("package.json");

for (const token of [
  "export const dynamic = \"force-dynamic\"",
  "robots",
  "index: false",
  "follow: false",
  "cookies()",
  "createCartService().readCurrentCart",
  "GUEST_CART_COOKIE_NAME",
  "CartPageClient",
]) mustInclude(page, token, "/cart route");

for (const forbidden of [
  "MongoCartRepository",
  "collection(",
  "localStorage",
  "sessionStorage",
  "document.cookie",
  "guestTokenHash",
  "owner.userId",
  "_id",
  "Stripe(",
  "paypal",
  "/checkout",
]) mustNotInclude(page, forbidden, "/cart route");

for (const token of [
  '"use client"',
  "<h1",
  "Your Bag",
  "aria-live=\"polite\"",
  "removeCartItemAction",
  "updateCartItemQuantityAction",
  "clearCartAction",
  "readCurrentCartAction",
  "publishCartView",
  "formatMinorUnitMoney",
  "cart-quantity-stepper",
  "Decrease ${item.productName} quantity",
  "Increase ${item.productName} quantity",
  "Online availability currently unavailable",
  "Your bag changed in another tab",
  "Subtotal",
  "Explore Fragrances",
  "Tax, shipping, discounts, gift cards, and payment are introduced in later commerce stages.",
]) mustInclude(client, token, "Cart page client");

for (const forbidden of [
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "guestTokenHash",
  "owner.userId",
  "cartId",
  "href=\"/checkout\"",
  "action=\"/checkout\"",
  "Add to Bag",
  "addToBag",
  "reserve(",
  "release(",
  "commit(",
  "Stripe(",
  "paypal",
]) mustNotInclude(client, forbidden, "Cart page client");

for (const forbiddenQuantityInput of [
  "quantity dropdown",
  "type=\"number\"",
]) mustNotInclude(client, forbiddenQuantityInput, "Cart page controlled stepper boundary");

mustInclude(drawer, 'href="/cart"', "Cart drawer real View Bag link");

for (const token of [
  ".cart-page",
  ".cart-page__content",
  ".cart-page-summary",
  ".cart-page-state",
  "@media (max-width: 980px)",
  "@media (max-width: 680px)",
  "@media (max-width: 380px)",
  "@media (prefers-reduced-motion: reduce)",
]) mustInclude(styles, token, "Cart page responsive styles");

mustInclude(packageJson, "domain:cart:page:check", "package script");

const sourceFiles = [];
const scan = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) scan(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) sourceFiles.push(path);
  }
};
scan("src");
for (const file of sourceFiles) {
  mustNotInclude(read(file), "server-only-loader", `${file} production source`);
}

console.log("PASS: Full cart page is private, service-backed, accessible, synchronized, quantity-aware, and free of checkout/cinematic scope.");
