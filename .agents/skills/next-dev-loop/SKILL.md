---
name: next-dev-loop
description: >
  Verify Next.js runtime behavior after editing app code. Use this
  skill to confirm a change actually works in a running app — not
  just that it compiles or type-checks. Combines /_next/mcp
  (Next.js's view) with agent-browser (the browser's view).
  Requires a running `next dev`.
---

# next-dev-loop

The edit/verify rhythm during `next dev` — make a change, then
confirm it actually works at runtime, not only that the types or
the build are happy.

You verify through two views of the same running app:

- **`/_next/mcp`** — an HTTP endpoint Next.js exposes about itself.
  Knows framework-specific things: routes, segments, RSC, server
  actions, server logs, and errors as Next.js saw them. Call
  `tools/list` for the current surface.
- **`agent-browser`** — a CLI that drives a real Chrome. Knows
  framework-agnostic browser things: DOM, console, network, React
  fiber, vitals. Before driving it, run `agent-browser skills get core`
  once for the version-matched usage guide — don't guess subcommands
  from memory.

The two views cross-check each other.

## Workflow

1. **Verify Dev Server**:
   Ensure `npm run dev` is running on the local port (e.g. `http://localhost:3000`).
2. **Inspect Runtime Behavior**:
   - Check HTTP response status codes for edited routes.
   - Inspect console logs, network errors, and runtime diagnostics.
   - Confirm `<Suspense>` boundaries render golden skeleton fallbacks during data streaming.
3. **Validate Route Transitions**:
   - Perform soft client-side navigations between routes (`/`, `/collections`, `/fragrances/women`, `/fragrances/men`, `/new-arrivals`, `/cart`).
   - Verify zero layout shift and immediate static shell display.
