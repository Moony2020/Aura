# AURA Routes

## Existing

| Route | Status | Purpose |
|---|---|---|
| `/` | Existing | Cinematic Hero / Portal and six fragrance worlds |
| `/_not-found` | Framework generated | Current default not-found surface |

## Planned Storefront

`/fragrances`, `/fragrances/women`, `/fragrances/men`, `/fragrances/unisex`, `/fragrances/[family]`, `/collections`, `/collections/[slug]`, `/new-arrivals`, `/gifts`, `/product/[slug]`, `/search`.

## Planned Commerce

`/cart`, `/checkout`, `/checkout/success`, `/checkout/cancel`, `/gift-cards`.

## Planned Account

`/login`, `/register`, `/forgot-password`, `/reset-password`, `/account`, `/account/profile`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/wishlist`, `/account/security`.

## Planned Editorial and Legal

`/about`, `/our-story`, `/sustainability`, `/contact`, `/faq`, `/boutiques`, `/privacy-policy`, `/terms-of-service`, `/shipping-returns`, `/cookie-policy`.

## Planned Administration

`/admin` and nested operational routes for products, collections, inventory, orders, customers, discounts, gift cards, content, newsletter, and audit history. Every admin route requires server-side role authorization.

Route groups may organize code without changing public URLs. Dynamic content routes read from the domain/database rather than duplicate hard-coded pages.
