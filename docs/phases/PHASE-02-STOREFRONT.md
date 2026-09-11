# Phase 2 — Storefront & Product Discovery

**Status:** COMPLETE.

## Stage 2.1 — Storefront Shell & Shared Layout

**Status:** **COMPLETE**.

Stage 2.1 established a separate `(storefront)` App Router layout and a small server-renderable shell with semantic header, main, footer, skip navigation, responsive gutters, Maison typography/colors, focus visibility, and reduced-motion compatibility inherited from the global foundation.

The cinematic `(cinematic)` route remains independent. The storefront shell does not import `HeroPortalExperience`, `FragranceWorlds`, `FragranceWorldSection`, GSAP, or cinematic video logic. No product arrays, commerce providers, navigation behavior, search, catalog, or public storefront pages were added.

### Verification

- TypeScript, lint, production build, security audit, and `git diff --check` pass.
- Storefront source has no cinematic component, GSAP, or video imports.
- Existing `/` build remains stable; the five documented legacy lint warnings remain non-blocking.
- No Phase 1 domain or cinematic component was rewritten.

### Deferred boundaries

Global navigation is Stage 2.2. Desktop mega menus are Stage 2.3. Mobile navigation is Stage 2.4. Catalog, collections, product detail, search, filters, and new arrivals remain deferred to their dedicated stages. Commerce state and account functionality remain deferred to later phases.

## Stage 2.2 — Global Navigation

**Status:** **COMPLETE**.

Stage 2.2 added centralized navigation configuration, the Maison desktop navigation shell, active-route semantics for the available home destination, planned-state treatment for routes that do not yet exist, keyboard/focus styling, sticky header-compatible structure, and non-functional Search/Account/Bag icon boundaries. The header remains server-rendered; no client provider or global commerce state was introduced.

Mega menus, final mobile navigation, search overlay, authentication, and real bag/cart behavior remain deferred to their owning stages.

### Verification

- TypeScript, lint, production build, high-severity security audit, and `git diff --check` pass.
- Only the existing `/` destination is rendered as a live link; planned destinations cannot create 404 navigation or fake functionality.
- Navigation configuration is centralized in `src/config/storefront-navigation.ts`.
- `npm run domain:storefront:navigation:check` verifies trigger ARIA attributes, Escape/pointer/focus handlers, canonical collection loading, planned destination boundaries, and mobile isolation.
- No Mega Menu, mobile drawer, search overlay, authentication, cart state, or cinematic runtime dependency was added.

## Stage 2.3 — Desktop Mega Menus

**Status:** **COMPLETE**.

Stage 2.3 added a desktop-only AURA mega-menu for Fragrances and Collections. The interactive controller is isolated in `StorefrontMegaMenu.tsx`; the surrounding header and canonical collection query remain server-rendered. Fragrance taxonomy entries are centralized configuration and remain planned/non-navigable until their owning routes exist. Collections are read from the visible MongoDB collection repository and are displayed without inventing a second catalog source.

The controller supports click, hover, focus, `aria-expanded`, `aria-controls`, Escape-to-close with focus restoration, outside-pointer close, and non-modal navigation behavior. It is hidden below the desktop breakpoint so it does not become a broken mobile drawer. No search overlay, authentication, cart, GSAP, or cinematic runtime was added.

### Verification

- `domain:storefront:navigation:check`, TypeScript, lint, production build, security audit, and `git diff --check` pass.
- Repeated trigger interaction paths are represented by deterministic click/focus/hover state transitions; Escape restores focus to the active trigger.
- Only `/` is a live destination; planned items and canonical collections are not rendered as fake links.
- Storefront files contain no cinematic runtime imports.

## Stage 2.4 — Mobile Navigation

**Status:** **COMPLETE**.

Stage 2.4 added an isolated `MobileNavigation` client controller while keeping `StorefrontHeaderShell` server-rendered. It reuses the shared navigation configuration and serializable canonical collection summaries, presents a full-screen Maison drawer, supports tap/click expandable Fragrances and Collections groups, locks body scrolling, traps focus within the overlay, closes via Escape/backdrop/close control, restores focus to the trigger, and handles desktop breakpoint resize by closing safely. Safe-area insets and bounded scrolling prevent clipping on small mobile screens.

The desktop mega-menu is hidden below the shared breakpoint and the mobile drawer is not rendered as a desktop navigation surface. Search, account, cart, wishlist, catalog pages, and cinematic runtime remain outside this stage.

### Verification

- `domain:storefront:navigation:check`, TypeScript, lint, production build, security audit, and `git diff --check` pass.
- The client component contains no MongoDB driver or connection code; the server loader passes only `{slug, name}` collection summaries.
- Repeated open/close, Escape focus restoration, focus cycling, scroll-lock cleanup, resize separation, safe-area padding, and planned-route boundaries are covered by the navigation assertions.

## Stage 2.5 — Fragrance Catalog

**Status:** **COMPLETE**.

Stage 2.5 added the real `/fragrances` storefront route using a server-only application query over `MongoProductRepository.listPublished()`. The page renders only canonical published Product data, with family and collection labels resolved from their domain repositories, lowest active-variant pricing, an explicit “From” policy for multi-variant products, and canonical ProductMedia. Cloudinary video media is represented by a derived poster URL; catalog cards do not load or play video.

The presentation uses AURA’s Maison direction—warm black, ivory, champagne-gold accents, serif editorial typography, generous spacing, and restrained image motion—without introducing mock product arrays. Cards remain presentation-only until the Product Detail stage; there are no fake links, cart actions, search, filters, or commerce state. Empty and database-failure states use safe public error translation. The existing cinematic route and runtime were not imported or redesigned.

### Verification

- `domain:storefront:catalog:check` passes, asserting the published query boundary, canonical media/price policy, safe states, live `/fragrances` navigation, and cinematic/commerce isolation.
- HTTP smoke verification returned 200 for `/fragrances`, rendered all six canonical seeded product names and the editorial heading, and exposed no MongoDB/runtime diagnostics in the response.
- TypeScript, lint, production build, high-severity security audit, and `git diff --check` pass. The five previously documented lint warnings remain non-blocking and are outside this stage.
- The route is dynamic server-rendered and the client bundle contains no MongoDB driver, seed manifest, GSAP, cinematic, cart, or search dependency.

### Deferred boundaries

Women/Men/Unisex campaign pages are Stage 2.6. Collection landing pages are Stage 2.7. Product detail is Stage 2.8. Search and filters are Stages 2.9–2.10. Cart, wishlist, account, and checkout remain deferred to later phases.

## Stage 2.6 — Women / Men / Unisex Campaign Pages

**Status:** **COMPLETE**.

Stage 2.6 added the editorial audience routes `/fragrances/women`, `/fragrances/men`, and `/fragrances/unisex`. All three routes reuse the Stage 2.5 server-only published-fragrance query and the same canonical FragranceCard presentation. The query accepts an optional `WOMEN`/`MEN`/`UNISEX` Product audience and filters only by that explicit domain value; it does not infer commercial segmentation from a product name, image, family, or cinematic world.

The Product contract supports an optional audience field, and the owner-approved accessible-luxury migration now assigns exactly 30 canonical products: 10 Women, 10 Men, and 10 Unisex. It updates the three overlapping products (`Élixir de Rose`, `Jasmine Nocturne`, and `Citrus Vetiver`), archives `Noir Cashmere`, `Amber Mystique`, and `Golden Santal` without deletion, and applies only the explicitly supplied variant prices. The routes use distinct rose, bronze, and ivory Maison themes within one AURA identity. No video-world assets, GSAP runtime, mock best-seller claims, ratings, filters, search, cart, or product-detail behavior were added.

Women, Men, and Unisex are now live destinations in the desktop mega menu and mobile navigation. MongoDB failures use the existing safe error serialization boundary.

### Verification

- `domain:storefront:campaigns:check`, catalog checks, and navigation checks pass.
- `db:catalog:migrate` passed with exactly 30 canonical published products and 10/10/10 audience counts; the migration is non-destructive and idempotent by stable slugs.
- HTTP smoke verification returned 200 for `/`, `/fragrances`, `/fragrances/women`, `/fragrances/men`, and `/fragrances/unisex`, with audience routes rendering only their matching canonical products.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass. The five existing lint warnings remain non-blocking.
- Campaign pages are server-rendered, have heading/alert semantics, bounded responsive layout, and no cinematic or commerce runtime imports.

### Deferred boundaries

Owner-approved audience assignments are a data operation, not an inference task. Collection landing pages are Stage 2.7. Product detail is Stage 2.8. Search and filters are Stages 2.9–2.10.

## Stage 2.7 — Collection Landing Pages

**Status:** **COMPLETE**.

Stage 2.7 added `/collections` and `/collections/[slug]` through server-only application read services. The public index reads only `PUBLISHED` + `PUBLIC` collections; the detail service applies the same guard before resolving membership IDs to canonical published Products. Membership order is preserved by `position`, archived/unpublished products are excluded, and no collection document or UI card duplicates commercial Product facts.

The hidden cinematic collection is excluded from the public index and direct access returns `notFound()`. No new commercial collection was invented because no owner-approved public membership existed; `/collections` therefore renders an intentional Maison empty state. Published collection memberships and campaign media are ready for future owner-approved editorial content. Collections are now live in primary navigation, and public collection summaries become real links in desktop and mobile menus. Product cards remain non-navigational pending Stage 2.8.

### Verification

- `domain:storefront:collections:check` and navigation checks pass.
- HTTP smoke verification returned 200 for `/collections`, `/`, `/fragrances`, and all three audience routes; `/collections/cinematic-worlds` returned 404 because the cinematic collection is hidden.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass. The remaining root font warning is non-blocking.
- Read services contain no GSAP/cinematic runtime or commerce dependencies and translate MongoDB failures through the safe public error boundary.

### Deferred boundaries

Owner-approved public collection membership and editorial content remain data decisions. Product detail is Stage 2.8. Search and filters are Stages 2.9–2.10.

## Stage 2.8 — Product Detail Page

**Status:** **COMPLETE**.

Stage 2.8 added the canonical `/product/[slug]` route. A server-only read service resolves a slug through the Product Repository and related Collection, Fragrance Family, Fragrance Note, taxonomy-link, and variant inventory repositories. Only published products are public; archived, unpublished, invalid, and hidden references resolve to `notFound()`. MongoDB failures use the safe Error Architecture boundary.

The editorial PDP includes canonical media gallery/poster/video handling, accessible media thumbnails, AURA identity, audience/family/concentration context, ordered TOP/HEART/BASE notes when published taxonomy exists, and a keyboard-operable variant selector. Variant changes update the displayed price, size, SKU, concentration, and availability. The UI intentionally has no fake Add to Bag, wishlist, reviews, quantity, shipping, payment, or checkout behavior. Catalog, audience, and collection cards now link to the PDP, while cinematic runtime and seed manifests remain outside the route.

The three explicit multi-variant products expose their owner-supplied sizes/prices: Velvet Rose (50/75/100 ml), Élixir de Rose (50/75/100 ml), and Oud Majesté (50/75/100 ml). Other products expose only the canonical variant data actually present; no sizes or prices are invented.

### Verification

- `domain:storefront:product-detail:check` passes for published-only routing, canonical media/taxonomy/variant reads, accessibility controls, card navigation, and cinematic/commerce isolation.
- Production HTTP smoke test: published Velvet Rose, Élixir de Rose, and Oud Majesté returned 200; archived Noir Cashmere and invalid slugs returned 404. `/`, `/fragrances`, all audience routes, and `/collections` remained available.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass. The root font warning remains non-blocking.

### Deferred boundaries

Add to Bag, cart state, wishlist, reviews, quantity/shipping/payment/checkout, recommendations, search, and filters remain deferred to their owning stages.

## Stage 2.9 — Search Foundation & Full-Screen Search

**Status:** **COMPLETE**.

Stage 2.9 added canonical storefront search without turning the Header into a client component. The interactive overlay is isolated in its own client boundary, while results come from the Product domain, published-product guards, taxonomy links, and safe serializable view models. Search accepts normalized user text, rejects oversized queries, includes taxonomy matches such as `elixir` → `Élixir de Rose`, and excludes archived/unpublished products.

### Verification

- `domain:storefront:search:check` passes for search service, API, client overlay accessibility boundary, server-rendered `/search`, oversized-query handling, and no Mongo/client/filter leakage.
- Full `npm audit` passed with 0 vulnerabilities through the controlled local npm runtime.

### Deferred boundaries

Filters and sorting are Stage 2.10. New Arrivals is Stage 2.11. No search rewriting is planned unless later stages need a small shared query primitive.

## Stage 2.10 — Filters & Sorting

**Status:** **COMPLETE**.

Stage 2.10 added URL-source-of-truth catalog filters and deterministic sorting over the canonical storefront query layer. Supported inputs include audience, fragrance family, price range, availability, and sort order. Query parameters are validated and normalized before reaching the application query service; the browser never sends raw MongoDB operators, and filtering is not performed client-side after loading all products.

Price filtering/sorting uses the documented catalog policy: the lowest published sellable variant price. Money remains stored as integer minor units in MongoDB, while user-facing URL inputs stay in major currency units and are converted internally for comparison.

### Verification

- `domain:storefront:filters:check` passes for URL state, desktop/mobile controls, active chips, validation, empty state, and server-side query boundaries.
- `db:catalog:prices:minor-units:check` verifies published sellable variants use integer minor units and examples `7500`, `12900`, and `15900` remain canonical.
- TypeScript, production build, full `npm audit`, storefront regressions, and `git diff --check` pass.

### Deferred boundaries

Best-selling, ratings, most-reviewed, and trending filters require real commerce/analytics data and remain intentionally absent.

## Stage 2.11 — New Arrivals

**Status:** **COMPLETE**.

Stage 2.11 added the real `/new-arrivals` route and made New Arrivals live in desktop and mobile navigation. New Arrival eligibility is explicit merchandising data from the Product domain through optional `launchAt`; technical MongoDB `createdAt` is not used because migration time is not commercial launch time.

The page renders an editorial Maison landing state and canonical Product Cards for published products whose `launchAt` is approved and not in the future. If no products are marked, the page intentionally renders a respectful empty state instead of inventing New Arrivals.

### Verification

- `db:products:launch-at:migrate` passed, allowing/indexing `launchAt` and reporting 0 currently marked published products.
- `domain:storefront:new-arrivals:check` passes for canonical `launchAt` use, live navigation, published product cards, safe empty state, and no `createdAt`, fake merchandising, or cinematic runtime leakage.
- Regression checks for catalog, filters, search, navigation, collections, PDP, campaigns, minor-unit money, TypeScript, production build, full `npm audit`, and `git diff --check` pass.

### Deferred boundaries

Cart, wishlist, search changes, additional filters, fake launch dates, limited-edition claims, countdowns, cinematic/GSAP runtime, and admin merchandising UI remain deferred. Stage 2.12 — Responsive & Accessibility QA is complete.

## Stage 2.12 — Responsive & Accessibility QA

**Status:** **COMPLETE**.

Stage 2.12 was limited to QA and bug fixes across the existing Storefront surfaces. No redesign, product feature, commerce action, or cinematic runtime was added. Modal surfaces now use real button backdrops, preserve keyboard focus traps/Escape handling, restore the invoking trigger and scroll position, and retain body-scroll cleanup. Existing safe-area, `dvh`, reduced-motion, focus-visible, and overflow rules were checked as part of the responsive contract.

### QA matrix

| Surface | Desktop 1440/1280 | Tablet 1024/768 | Mobile 430/390/360/320 | Keyboard/focus | Result |
| --- | --- | --- | --- | --- | --- |
| Header, mega menu, mobile navigation | Reviewed | Reviewed | Reviewed | Escape, trap, restore | PASS |
| Catalog, audience routes, filters/sorting | Reviewed | Reviewed | Reviewed | labelled controls, chips | PASS |
| Collections and dynamic collections | Reviewed | Reviewed | Reviewed | links remain native links | PASS |
| PDP gallery and variant selector | Reviewed | Reviewed | Reviewed | pressed/selected state, fieldset | PASS |
| Search overlay and `/search` | Reviewed | Reviewed | Reviewed, including short viewport | Escape, trap, restore | PASS |
| `/new-arrivals` and empty/error states | Reviewed | Reviewed | Reviewed | readable Maison states | PASS |

Static interaction contract: `domain:storefront:responsive-a11y:check` verifies landmarks, focus-visible policy, safe-area/`dvh`/reduced-motion rules, modal semantics, focus traps, Escape handling, scroll restoration, accessible backdrops, gallery state, and labelled variants. The explicit viewport targets are 1440, 1280, 1024, 768, 430, 390, 360, and 320px.

### Verification

- `domain:storefront:responsive-a11y:check` — PASS.
- Regression checks for `/`, `/fragrances`, all audience routes, collections, PDP, search, filtered catalog, and `/new-arrivals` — PASS via existing storefront contract suites.
- TypeScript, local ESLint, production build, and full `npm audit` (0 vulnerabilities) — PASS. `npm run lint` itself remains blocked by the known broken host npm shim; the same local ESLint command passes with one existing font warning and no errors.
- `git diff --check` — PASS; Git reports only Windows line-ending warnings and no whitespace errors.

### Deferred boundaries

Stage 2.13 Phase 2 Sign-Off is complete. Cart, wishlist, persistent commerce state, and checkout remain Phase 3.

## Stage 2.13 — Phase 2 Sign-Off

**Status:** **COMPLETE**.

Phase 2 is signed off as a domain-backed product discovery layer. The complete discovery flow is now Navigation -> Catalog -> Audience/Collections -> Search/Filters -> Product Detail, without purchase behavior.

The final review confirmed that Stages 2.1 through 2.12 are documented complete, storefront routes remain isolated from the cinematic runtime, and no planned commerce or merchandising feature was represented as fake functionality. MongoDB/Product Domain remains the source of truth for published products, audience assignment, collection visibility, taxonomy, media, launch eligibility, and money. Published catalog prices are stored as integer minor units, 30 canonical products remain published with 10/10/10 audience integrity, archived products are excluded from public discovery, and the cinematic collection remains hidden.

### Final verification

- Storefront contract suite — PASS: navigation, catalog, audience routes, collections, PDP, search, filters/sorting, new arrivals, responsive/accessibility, minor-unit money, cinematic mapping, and foundation integration.
- Production HTTP smoke — PASS: `/`, `/fragrances`, Women/Men/Unisex routes, `/collections`, `/search?q=elixir`, filtered catalog, and `/new-arrivals` returned 200; all 30 published PDP slugs returned 200; hidden collection, archived PDP, and invalid PDP returned 404; oversized search API returned 400.
- Database verification — PASS: 30 published catalog products, Women/Men/Unisex counts of 10 each, no old dollar-price values in published variants, `cinematic-worlds` visibility is `HIDDEN`, and no published products are marked as New Arrivals without `launchAt`.
- Runtime boundary scan — PASS: no storefront/runtime imports of cinematic seed manifests, seed scripts, GSAP, cinematic components, cart provider, fake ratings, fake trending, or fake best-seller signals.
- TypeScript — PASS via `node .\node_modules\typescript\bin\tsc --noEmit`.
- Local ESLint — PASS via `node .\node_modules\eslint\bin\eslint.js . --ext .js,.mjs,.ts,.tsx`; one existing root font warning remains non-blocking.
- Production build — PASS via `node .\node_modules\next\dist\bin\next build`.
- Full security audit — PASS, 0 vulnerabilities via the controlled local npm CLI.
- `git diff --check` — PASS; Git reports Windows line-ending warnings only and no whitespace errors.

### Known non-blocking issues

- The global npm shim on the host is broken and prevents `npm run lint`; direct local tool invocations pass.
- The root-layout custom font warning remains existing technical debt.
- Windows line-ending warnings appear during Git checks but do not indicate whitespace errors.
- Browser automation is not installed, so Stage 2.12/2.13 responsive checks are static/manual contract verification rather than pixel-level Playwright evidence.

### Phase 2 acceptance

**PHASE 2 — STOREFRONT & PRODUCT DISCOVERY: APPROVED / COMPLETE.**

Stage 3.1 — Commerce Architecture is ready but not started.
