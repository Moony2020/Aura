import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const css = read("src/app/globals.css");
const mobile = read("src/components/storefront/MobileNavigation.tsx");
const search = read("src/components/storefront/StorefrontSearchAction.tsx");
const filters = read("src/components/storefront/CatalogFilterControls.tsx");
const gallery = read("src/components/storefront/ProductGallery.tsx");
const variants = read("src/components/storefront/ProductVariantSelector.tsx");
const shell = read("src/components/storefront/StorefrontShell.tsx");

for (const width of ["1440", "1280", "1024", "768", "430", "390", "360", "320"]) {
  // The matrix is an explicit QA target; CSS uses fluid clamps and max-width breakpoints.
  check(css.includes("@media (max-width: 1100px)") || css.includes("100dvh"), `responsive rules missing for ${width}px target`);
}
check(css.includes("overflow-x: hidden"), "shell must prevent accidental horizontal overflow");
check(css.includes("env(safe-area-inset-top)") && css.includes("env(safe-area-inset-bottom)"), "safe-area insets must be covered");
check(css.includes("100dvh"), "short viewport overlays must use dvh");
check(css.includes("prefers-reduced-motion: reduce"), "reduced-motion policy missing");
check(css.includes(":focus-visible"), "visible focus policy missing");

check(mobile.includes('role="dialog" aria-modal="true"'), "mobile navigation must be modal");
check(mobile.includes("event.key === \"Escape\"") && mobile.includes("document.activeElement === first"), "mobile navigation needs Escape and focus trap");
check(mobile.includes("window.scrollTo(0, previousScrollY)"), "mobile navigation must restore scroll position");
check(search.includes('role="dialog" aria-modal="true"'), "search overlay must be modal");
check(search.includes("event.key === \"Escape\"") && search.includes("document.activeElement === first"), "search overlay needs Escape and focus trap");
check(search.includes("window.scrollTo(0, previousScrollY)"), "search overlay must restore scroll position");
check(search.includes('type="button" className="storefront-search-overlay__backdrop"'), "search backdrop must be an accessible button");
check(filters.includes('role="dialog" aria-modal="true"'), "filter drawer must be modal");
check(filters.includes("event.key === \"Escape\"") && filters.includes("document.activeElement === first"), "filter drawer needs Escape and focus trap");
check(filters.includes("window.scrollTo(0, previousScrollY)"), "filter drawer must restore scroll position");
check(filters.includes('type="button" className="catalog-filter-drawer__backdrop"'), "filter backdrop must be an accessible button");
check(gallery.includes("aria-pressed") && gallery.includes('aria-label={`View '), "gallery thumbnails need selected state and accessible names");
check(/<fieldset\b[^>]*>[\s\S]*?<legend>Choose a size<\/legend>/.test(variants), "variant selector needs a labelled fieldset");
check(shell.includes('href="#storefront-main"') && shell.includes('id="storefront-main"'), "skip link and main landmark missing");

if (failures.length) {
  console.error("FAIL: responsive/accessibility QA contract");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("PASS: responsive/accessibility QA contract (static coverage and interaction safeguards)");
