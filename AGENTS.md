# Agent Guidelines for Aura

After every edit, verify pages still work at runtime using next-dev-loop skill.

## Core Directives
1. **Instant Navigations**: The storefront uses a Static Shell architecture for immediate page transitions. Static shells (Header, Navigation, Hero outline, Footer) must commit immediately.
2. **Suspense Boundaries**: Dynamic database queries and request-bound operations must be wrapped within `<Suspense>` boundaries with luxury golden skeletons so that pages open with zero delay and stream dynamic content.
3. **Cache Components**: Static elements and cached components are preserved across navigations without redundant server roundtrips.
4. **Development Verification**: After every edit, verify pages still work at runtime using next-dev-loop skill.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
