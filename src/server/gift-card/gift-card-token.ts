import "server-only";
import { createHash, randomBytes } from "node:crypto";
export function generateGiftCardCode() { return randomBytes(24).toString("base64url").toUpperCase(); }
export function normalizeGiftCardCode(value: string) { return value.trim().replace(/[-\s]/g, "").toUpperCase(); }
export function hashGiftCardCode(value: string) { return createHash("sha256").update(normalizeGiftCardCode(value)).digest("hex"); }
export function maskGiftCardCode(value: string) { const normalized = normalizeGiftCardCode(value); return `•••• •••• •••• ${normalized.slice(-4)}`; }
