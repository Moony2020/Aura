# Agent Guidelines for Aura

After every edit, verify pages still work at runtime using next-dev-loop skill.

## Core Directives
1. **Instant Navigations**: The storefront uses a Static Shell architecture for immediate page transitions. Static shells (Header, Navigation, Hero outline, Footer) must commit immediately.
2. **Suspense Boundaries**: Dynamic database queries and request-bound operations must be wrapped within `<Suspense>` boundaries with luxury golden skeletons so that pages open with zero delay and stream dynamic content.
3. **Cache Components**: Static elements and cached components are preserved across navigations without redundant server roundtrips.
4. **Development Verification**: After every edit, verify pages still work at runtime using next-dev-loop skill.
