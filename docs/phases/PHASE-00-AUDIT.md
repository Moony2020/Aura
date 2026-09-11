# Phase 0 — Repository Audit & Baseline

## Status

**PHASE 0 — COMPLETE**  
**Sign-off date:** 2026-08-17

## Existing Technical Stack

- Next.js 14.2.x App Router, React 18.3.x, React DOM 18.3.x.
- Strict TypeScript 5 configuration.
- Tailwind CSS 3.4 with custom AURA colors/fonts.
- GSAP 3 with `@gsap/react` and ScrollTrigger.
- Lucide React icons, `clsx`, and `tailwind-merge`.
- npm lockfile is tracked and remains authoritative.

## Existing Routes

- `/` — cinematic homepage.
- Framework-generated `/_not-found`.
- No API, account, commerce, editorial, product, collection, or admin routes.

## Existing Components

- `Navbar.tsx` — fixed navigation, visual search, account, bag, and mobile menu.
- `HeroPortalExperience.tsx` — pinned GSAP portal transition and World 1.
- `FragranceWorlds.tsx` — hard-coded World 2–6 product data and videos.
- `FragranceWorldSection.tsx` — reusable cinematic world presentation.
- `WorldProgressRail.tsx` — observed world position/navigation.
- `Footer.tsx` — brand, visual newsletter, links, social, and legal surfaces.

## Existing Cinematic Experience

The homepage contains a cinematic Hero/Portal, GSAP scroll transition into World 1, five additional viewport fragrance worlds, world progress rail, video lifecycle behavior, note presentations, `ACQUIRE`, `EXPLORE NOTES`, and `RETURN TO PORTAL`. The signature visual experience is protected from wholesale redesign.

## Existing Media Architecture

- Hero and six world videos resolve from `NEXT_PUBLIC_CLOUDINARY_*` variables with hard-coded Cloudinary fallback URLs.
- Five local images exist in `public/assets`; all are 1024px source assets and the hero bottle PNG is approximately 2.47 MB.
- Google Fonts are linked from the root layout.
- Hero video uses `preload="auto"`; fragrance-world videos use metadata preload and IntersectionObserver playback.

## Current Product Data Architecture

Product copy, classifications, prices, notes, accent colors, layout choices, and video URLs are embedded in client components. World 1 is separately hard-coded in `HeroPortalExperience.tsx`; Worlds 2–6 are an array in `FragranceWorlds.tsx`. There is no shared product identifier, slug, variant, repository, or server source of truth.

## Current Functional Features

- Cinematic scroll and transition behavior.
- World video play/pause behavior.
- Progress rail navigation.
- Mobile menu toggle and visual search toggle.
- Smooth return-to-top controls.
- Reduced-motion CSS override.

## Current Non-Functional / Visual-Only Features

- Search has no query/results logic.
- Account and bag actions have no destination/state.
- Bag quantity is fixed at zero.
- `ACQUIRE` and `EXPLORE NOTES` do not execute commerce/navigation actions.
- Newsletter has no validation or persistence.
- Footer navigation, legal, and social links use `#`.

## Missing Backend Systems

No database, schema, ORM, repositories, API routes, server actions, authentication, authorization, cart, wishlist, checkout, payments, order system, email system, admin system, persistent content, or automated test suite exists.

## Technical Risks

- Duplicate/hard-coded product data will diverge across future surfaces unless migrated to one domain source.
- Client-only controls can create false functionality if pages are added before backend boundaries.
- Authentication, payment, inventory, and admin authorization require explicit server trust boundaries.
- Existing animation components are high-risk regression surfaces and should be integrated incrementally.
- Mixed package managers can create lockfile churn; npm is the repository standard.

## Performance Risks

- Large video payloads and hero `preload="auto"` can delay useful content.
- A second autoplay hero video is rendered inside the collection card.
- Local images are large and several use native `<img>` rather than Next image optimization.
- Several continuously animated decorative effects require off-screen/reduced-motion review.
- Current production baseline is 143 kB first-load JavaScript for `/`.

## Architecture Recommendations

- Retain a Next.js modular monolith with server-first boundaries.
- Initial recommendation: adopt PostgreSQL + Prisma for relational commerce state. This was superseded before implementation by the owner-selected MongoDB Atlas architecture (ADR-012).
- Establish Product/ProductVariant as the single source for cinematic and store experiences.
- Validate trust boundaries with Zod.
- Keep Cloudinary but centralize media metadata and poster/loading policies.
- Use database-backed guest carts with opaque secure identifiers and server recalculation.
- Add authentication, checkout, payments, and admin only in their dependency-ordered phases.

## Baseline Test Results

- TypeScript `tsc --noEmit`: **PASS**.
- Optimized Next.js build: **PASS**.
- Static generation: `/` and `/_not-found` generated successfully.
- Lint: **NOT CONFIGURED**; `next lint` opens an interactive setup prompt.
- Automated tests: **NOT AVAILABLE**; no test script/framework exists.
- Global npm command: **ENVIRONMENT ISSUE**; shim references a missing roaming `npm-cli.js`.

## Files Inspected

`package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, every file in `src/components/`, `.gitignore`, environment-file presence (values not exposed), and all `public/assets` metadata.

## Known Issues

- ESLint requires setup.
- No automated tests.
- Local npm shim is broken outside the application.
- User-owned untracked `.claude/settings.local.json` is intentionally untouched.

## Phase 0 Sign-Off

The baseline is understood, TypeScript and production build are verified, test limitations are explicit, and the audit-generated untracked pnpm lockfile has been removed. No unexplained tracked change enters Phase 1.

**PHASE 0 STATUS: COMPLETE**
