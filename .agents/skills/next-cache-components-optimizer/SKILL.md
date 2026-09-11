---
name: next-cache-components-optimizer
description: >
  Drive a Next.js route to instant navigation by setting up an agentic loop,
  under Cache Components / PPR, on initial load (hard navigation) and
  client-side navigation (soft navigation). Encode the goal as a failing
  @next/playwright instant() e2e and work it to green, one verified route at a
  time; the shipped test then guards against regression. Use when asked to make
  a route's navigation instant (its static shell commits immediately), fix a
  route whose static shell isn't prerendered/served/prefetched, grow a route's
  static shell or fix its slow first paint, diagnose which Suspense boundary
  keeps a route out of its static shell, or write the instant() e2e guard for
  one. Requires Next.js 16.3+ with cacheComponents; directs an upgrade if older.
---

# next-cache-components-optimizer

Drive Next.js routes from slow page transitions to Instant Navigations under Next.js 16.3+ Cache Components and Partial Pre-rendering (PPR).

## Two Navigations, Two Loading States

- **Initial Load (Hard Navigation)**:
  Commits the route's prerendered Static Shell immediately; dynamic segments stream in behind high-end loading skeletons (`<Suspense>` fallbacks, `loading.tsx`).
- **Client-Side Navigation (Soft Navigation)**:
  Commits the destination's prefetched App Shell instantly on link hover/prefetch, re-rendering only the segments that change.

## Optimization Strategy

1. **Grow the Static Shell**:
   Ensure maximum UI (Headers, Footers, Section Headers, Filter Bars, Card Skeletons) is part of the prerendered static shell.
2. **Eliminate Blocking Operations**:
   Never block page transitions waiting for database calls or remote APIs. Push queries into Suspense boundaries so the shell appears immediately with 0 delay.
3. **Guard Against Regressions**:
   Verify instant navigation across all storefront routes:
   - `/`
   - `/collections`
   - `/fragrances/women`
   - `/fragrances/men`
   - `/new-arrivals`
   - `/cart`
