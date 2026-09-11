import { emailSchema, normalizeEmail } from "../src/domain/shared/email.ts";
import { objectIdSchema } from "../src/domain/shared/identifiers.ts";
import { slugSchema } from "../src/domain/shared/slug.ts";
import { moneySchema } from "../src/domain/shared/money.ts";
import { quantitySchema } from "../src/domain/shared/quantity.ts";
import { paginationSchema, paginationOffset } from "../src/domain/shared/pagination.ts";
import { countryCodeSchema, normalizeCountryCode } from "../src/domain/shared/country.ts";
import { isValidDateBoundary } from "../src/domain/shared/timestamps.ts";
if (normalizeEmail("  A@Example.COM ") !== "a@example.com") throw new Error("Email normalization failed.");
if (normalizeCountryCode(" se ") !== "SE") throw new Error("Country normalization failed.");
emailSchema.parse("a@example.com"); objectIdSchema.parse("507f1f77bcf86cd799439011"); slugSchema.parse("amber-oud"); moneySchema.parse({ amount: 100, currency: "EUR" }); quantitySchema.parse(1); countryCodeSchema.parse("SE");
const page = paginationSchema.parse({}); if (page.page !== 1 || page.pageSize !== 24 || paginationOffset(2, 24) !== 24) throw new Error("Pagination defaults failed.");
if (!isValidDateBoundary(new Date())) throw new Error("Timestamp validation failed.");
for (const invalid of [() => emailSchema.parse("bad"), () => objectIdSchema.parse("bad"), () => slugSchema.parse("Bad Slug"), () => moneySchema.parse({ amount: -1, currency: "EUR" }), () => quantitySchema.parse(0), () => countryCodeSchema.parse("SWE"), () => paginationSchema.parse({ pageSize: 101 })]) { let rejected = false; try { invalid(); } catch { rejected = true; } if (!rejected) throw new Error("Shared validator accepted invalid input."); }
console.log("PASS: shared primitives and normalization boundaries are enforced.");
