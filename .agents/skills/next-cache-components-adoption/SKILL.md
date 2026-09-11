---
name: next-cache-components-adoption
description: >
  Turn on Cache Components in a Next.js app and resolve the blocking routes it
  surfaces. Use when the user wants to enable, adopt, or migrate to Cache
  Components, flip the `cacheComponents` flag, work through a flood of
  blocking-prerender / instant validation errors, run the
  `cache-components-instant-false` codemod, or decide between opting routes out
  with `export const instant = false` and fixing them in place.
---

# next-cache-components-adoption

Enable Cache Components on an app and walk it to a passing build. This skill sequences the work; per-error recipes live in the dev overlay fix cards and the build's terminal output.

## Overview & Requirements

- **Next.js 16.3 or later** with `cacheComponents: true` in `next.config`.
- Automates migration away from legacy route segment configs (`dynamic`, `revalidate`, `fetchCache`) to `use cache`, `cacheLife`, and granular `<Suspense>` boundaries.
- Resolves request-time blockers (`cookies()`, `headers()`, `params`, `searchParams`) by pushing them down into `<Suspense>`-wrapped children.

## Key Principles

1. **Static Shell Commitment**:
   Ensure layout shells, navigation, and static content are pre-rendered and served instantly.
2. **Granular Streaming with Suspense**:
   Wrap any dynamic database queries or request-time data inside `<Suspense>` boundaries with matching skeleton UI.
3. **Cache Directive**:
   Utilize `"use cache"` and `cacheLife` on data functions that can be cached across requests.
