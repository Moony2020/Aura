import "server-only";

import { z } from "zod";

import type { Cart, CartLine } from "../../domain/cart/cart.schema.ts";
import { objectIdSchema } from "../../domain/shared/identifiers.ts";
import { quantitySchema } from "../../domain/shared/quantity.ts";
import type { Product } from "../../domain/product/product.schema.ts";
import type { MinorUnitMoney } from "../../lib/money.ts";
import { AuraError, insufficientInventoryError, notFoundError, validationError } from "../../lib/errors/aura-error.ts";
import { ERROR_CODES } from "../../lib/errors/error-codes.ts";
import type { CartRepository } from "../repositories/cart-repository.ts";
import { MongoCartRepository } from "../repositories/mongo-cart-repository.ts";
import type { CartProductRepository } from "../repositories/cart-product-repository.ts";
import { MongoCartProductRepository } from "../repositories/mongo-cart-product-repository.ts";
import type { CartInventoryRepository } from "../repositories/cart-inventory-repository.ts";
import { MongoCartInventoryRepository } from "../repositories/mongo-cart-inventory-repository.ts";
import {
  buildGuestCartCookie,
  generateGuestCartToken,
  guestCartExpiresAt,
  hashGuestCartToken,
  isPlausibleGuestCartToken,
  type GuestCartCookieDescriptor,
} from "./guest-cart-token.ts";

export type CartOwnershipContext =
  | { kind: "GUEST"; guestToken?: string | null }
  | { kind: "USER"; userId: string };

export type CartAvailability = "AVAILABLE" | "OUT_OF_STOCK" | "UNTRACKED" | "UNAVAILABLE";

export type CartViewItem = {
  lineId: string;
  productSlug: string | null;
  productName: string;
  audience: Product["audience"] | null;
  concentration: string | null;
  variantId: string;
  variantLabel: string;
  quantity: number;
  media: { url: string; alt: string } | null;
  unitPrice: MinorUnitMoney | null;
  lineTotal: MinorUnitMoney | null;
  currency: string | null;
  availability: CartAvailability;
  quantityValid: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
};

export type CartViewModel = {
  status: "ACTIVE";
  items: CartViewItem[];
  itemCount: number;
  subtotal: MinorUnitMoney;
  currency: string;
  checkoutEligible: boolean;
  version: number;
};

export type CartMutationResult = {
  cart: CartViewModel;
  setCookie?: GuestCartCookieDescriptor;
};

const DEFAULT_CART_CURRENCY = "USD";

const expectedVersionSchema = z.number().int().nonnegative().optional();

const lineIdentitySchema = z
  .object({
    productId: objectIdSchema,
    variantId: z.string().uuid(),
  })
  .strict();

const publicProductSlugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);

const addItemSchema = lineIdentitySchema
  .extend({
    quantity: quantitySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const updateItemQuantitySchema = lineIdentitySchema
  .extend({
    quantity: z.number().int().nonnegative(),
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const versionSensitiveSchema = lineIdentitySchema
  .extend({
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const clearCartSchema = z.object({ expectedVersion: expectedVersionSchema }).strict().optional();

const addItemBySlugSchema = z
  .object({
    productSlug: publicProductSlugSchema,
    variantId: z.string().uuid(),
    quantity: quantitySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

export type AddItemInput = z.input<typeof addItemSchema>;
export type AddItemBySlugInput = z.input<typeof addItemBySlugSchema>;
export type UpdateItemQuantityInput = z.input<typeof updateItemQuantitySchema>;
export type RemoveItemInput = z.input<typeof versionSensitiveSchema>;
export type ClearCartInput = { expectedVersion?: number };

const encodedLineSchema = lineIdentitySchema;

type ResolveOwnedCartResult =
  | { cart: Cart; token?: string; cookie?: GuestCartCookieDescriptor }
  | { cart: null; token?: string; cookie?: GuestCartCookieDescriptor };

type CartServiceDependencies = {
  cartRepository?: CartRepository;
  productRepository?: CartProductRepository;
  inventoryRepository?: CartInventoryRepository;
};

export class CartService {
  private readonly carts: CartRepository;
  private readonly products: CartProductRepository;
  private readonly inventory: CartInventoryRepository;

  constructor(dependencies: CartServiceDependencies = {}) {
    this.carts = dependencies.cartRepository ?? new MongoCartRepository();
    this.products = dependencies.productRepository ?? new MongoCartProductRepository();
    this.inventory = dependencies.inventoryRepository ?? new MongoCartInventoryRepository();
  }

  async readCurrentCart(context: CartOwnershipContext): Promise<CartViewModel> {
    const owned = await this.resolveExistingActiveCart(context);
    return this.toViewModel(owned.cart);
  }

  async addItem(context: CartOwnershipContext, input: AddItemInput): Promise<CartMutationResult> {
    const parsed = addItemSchema.parse(input);
    const sellable = await this.requireSellableLine(parsed.productId, parsed.variantId);

    const owned = await this.resolveCartForMutation(context);
    const existingQuantity = owned.cart?.items.find((item) => item.productId === parsed.productId && item.variantId === parsed.variantId)?.quantity ?? 0;
    const targetQuantity = existingQuantity + parsed.quantity;
    await this.requirePermittedPositiveQuantity(sellable.variant, targetQuantity);

    const cart = owned.cart ?? (await this.createCartForMutation(context, owned));
    const expectedVersion = parsed.expectedVersion ?? owned.cart?.version;
    const mutated = await this.carts.addOrIncrementLine(cart.id, {
      productId: parsed.productId,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
      expectedVersion,
      ...(cart.owner.kind === "GUEST" ? { expiresAt: guestCartExpiresAt() } : {}),
    });

    return { cart: await this.toViewModel(mutated), setCookie: owned.cookie };
  }

  async addItemBySlug(context: CartOwnershipContext, input: AddItemBySlugInput): Promise<CartMutationResult> {
    const parsed = addItemBySlugSchema.parse(input);
    const product = await this.products.findBySlug(parsed.productSlug);
    if (!product) throw notFoundError("Product");

    return this.addItem(context, {
      productId: product.id,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
      expectedVersion: parsed.expectedVersion,
    });
  }

  async updateItemQuantity(context: CartOwnershipContext, input: UpdateItemQuantityInput): Promise<CartMutationResult> {
    const parsed = updateItemQuantitySchema.parse(input);
    const owned = await this.requireCartForExistingMutation(context);
    const existingLine = owned.cart.items.find((item) => item.productId === parsed.productId && item.variantId === parsed.variantId);
    if (!existingLine) throw notFoundError("Cart line");

    if (parsed.quantity > existingLine.quantity) {
      const sellable = await this.requireSellableLine(parsed.productId, parsed.variantId);
      await this.requirePermittedPositiveQuantity(sellable.variant, parsed.quantity);
    }

    const expiresAt = owned.cart.owner.kind === "GUEST" ? guestCartExpiresAt() : undefined;
    const mutated = await this.carts.setLineQuantity(owned.cart.id, {
      productId: parsed.productId,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
      expectedVersion: parsed.expectedVersion,
      ...(expiresAt ? { expiresAt } : {}),
    });

    return { cart: await this.toViewModel(mutated), setCookie: expiresAt && owned.token ? buildGuestCartCookie(owned.token, expiresAt) : undefined };
  }

  async removeItem(context: CartOwnershipContext, input: RemoveItemInput): Promise<CartMutationResult> {
    const parsed = versionSensitiveSchema.parse(input);
    const owned = await this.requireCartForExistingMutation(context);
    const expiresAt = owned.cart.owner.kind === "GUEST" ? guestCartExpiresAt() : undefined;
    const mutated = await this.carts.removeLine(owned.cart.id, {
      productId: parsed.productId,
      variantId: parsed.variantId,
      expectedVersion: parsed.expectedVersion,
      ...(expiresAt ? { expiresAt } : {}),
    });

    return { cart: await this.toViewModel(mutated), setCookie: expiresAt && owned.token ? buildGuestCartCookie(owned.token, expiresAt) : undefined };
  }

  async clearCart(context: CartOwnershipContext, input?: ClearCartInput): Promise<CartMutationResult> {
    const parsed = clearCartSchema.parse(input);
    const owned = await this.requireCartForExistingMutation(context);
    const expiresAt = owned.cart.owner.kind === "GUEST" ? guestCartExpiresAt() : undefined;
    const mutated = await this.carts.clearLines(owned.cart.id, {
      expectedVersion: parsed?.expectedVersion,
      ...(expiresAt ? { expiresAt } : {}),
    });

    return { cart: await this.toViewModel(mutated), setCookie: expiresAt && owned.token ? buildGuestCartCookie(owned.token, expiresAt) : undefined };
  }

  private async resolveExistingActiveCart(context: CartOwnershipContext): Promise<ResolveOwnedCartResult> {
    if (context.kind === "USER") {
      return { cart: await this.carts.findActiveUserCart(context.userId) };
    }

    if (!isPlausibleGuestCartToken(context.guestToken)) return { cart: null };

    const cart = await this.carts.findActiveGuestCartByTokenHash(hashGuestCartToken(context.guestToken));
    if (!cart) return { cart: null };

    if (this.isExpired(cart)) {
      await this.carts.markExpired(cart.id);
      return { cart: null };
    }

    return { cart, token: context.guestToken };
  }

  private async resolveCartForMutation(context: CartOwnershipContext): Promise<ResolveOwnedCartResult> {
    const existing = await this.resolveExistingActiveCart(context);
    if (existing.cart) return existing;

    if (context.kind === "USER") return { cart: null };

    const token = generateGuestCartToken();
    const expiresAt = guestCartExpiresAt();
    return {
      cart: null,
      token,
      cookie: buildGuestCartCookie(token, expiresAt),
    };
  }

  private async createCartForMutation(context: CartOwnershipContext, owned: ResolveOwnedCartResult): Promise<Cart> {
    if (context.kind === "USER") {
      const existing = await this.carts.findActiveUserCart(context.userId);
      return existing ?? this.carts.createUserCart({ userId: context.userId });
    }

    if (!owned.token || !owned.cookie) {
      throw new AuraError(ERROR_CODES.INTERNAL_ERROR, "Guest cart mutation lacked a generated token.");
    }

    return this.carts.createGuestCart({
      guestTokenHash: hashGuestCartToken(owned.token),
      expiresAt: owned.cookie.options.expires,
    });
  }

  private async requireCartForExistingMutation(context: CartOwnershipContext): Promise<{ cart: Cart; token?: string }> {
    const owned = await this.resolveExistingActiveCart(context);
    if (!owned.cart) throw notFoundError("Cart");
    return { cart: owned.cart, token: owned.token };
  }

  private isExpired(cart: Cart): boolean {
    return cart.owner.kind === "GUEST" && !!cart.expiresAt && cart.expiresAt <= new Date();
  }

  private async requireSellableLine(productId: string, variantId: string): Promise<{ product: Product; variant: Product["variants"][number] }> {
    const product = (await this.products.findByIds([productId])).find((candidate) => candidate.id === productId);
    if (!product || product.status !== "PUBLISHED") throw notFoundError("Product");

    const variant = product.variants.find((candidate) => candidate.id === variantId);
    if (!variant || !variant.isActive) throw notFoundError("Product variant");

    return { product, variant };
  }

  private async requirePermittedPositiveQuantity(variant: Product["variants"][number], targetQuantity: number): Promise<void> {
    const inventory = await this.inventory.getByVariantId(variant.id);
    if (!inventory || inventory.available <= 0 || targetQuantity > inventory.available) {
      throw insufficientInventoryError();
    }
  }

  private async toViewModel(cart: Cart | null): Promise<CartViewModel> {
    if (!cart) return emptyCartView();

    const productIds = [...new Set(cart.items.map((item) => item.productId))];
    const products = new Map((await this.products.findByIds(productIds)).map((product) => [product.id, product]));

    const items = await Promise.all(cart.items.map((line) => this.toViewItem(line, products.get(line.productId))));
    const currency = items.find((item) => item.currency)?.currency ?? DEFAULT_CART_CURRENCY;
    const subtotalAmount = items.reduce((sum, item) => sum + (item.lineTotal?.amount ?? 0), 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const checkoutEligible = items.length > 0 && items.every((item) => item.availability === "AVAILABLE" && item.quantityValid && item.unitPrice !== null);

    return {
      status: "ACTIVE",
      items,
      itemCount,
      subtotal: { amount: subtotalAmount, currency },
      currency,
      checkoutEligible,
      version: cart.version,
    };
  }

  private async toViewItem(line: CartLine, product: Product | undefined): Promise<CartViewItem> {
    const unavailable = (label = "Unavailable variant"): CartViewItem => ({
      lineId: encodeCartLineId(line),
      productSlug: product?.slug ?? null,
      productName: product?.name ?? "Unavailable fragrance",
      audience: product?.audience ?? null,
      concentration: null,
      variantId: line.variantId,
      variantLabel: label,
      quantity: line.quantity,
      media: primaryMedia(product),
      unitPrice: null,
      lineTotal: null,
      currency: null,
      availability: "UNAVAILABLE",
      quantityValid: false,
      canIncrement: false,
      canDecrement: line.quantity > 0,
    });

    if (!product || product.status !== "PUBLISHED") return unavailable();

    const variant = product.variants.find((candidate) => candidate.id === line.variantId);
    if (!variant || !variant.isActive) return unavailable();

    const inventory = await this.inventory.getByVariantId(variant.id);
    const availability: CartAvailability = inventory ? (inventory.available > 0 ? "AVAILABLE" : "OUT_OF_STOCK") : "UNTRACKED";
    const quantityValid = availability === "AVAILABLE" && !!inventory && line.quantity <= inventory.available;
    const canIncrement = quantityValid && !!inventory && line.quantity < inventory.available;
    const lineTotal = {
      amount: variant.price.amount * line.quantity,
      currency: variant.price.currency,
    };

    return {
      lineId: encodeCartLineId(line),
      productSlug: product.slug,
      productName: product.name,
      audience: product.audience ?? null,
      concentration: variant.concentration,
      variantId: variant.id,
      variantLabel: variant.name,
      quantity: line.quantity,
      media: primaryMedia(product),
      unitPrice: variant.price,
      lineTotal,
      currency: variant.price.currency,
      availability,
      quantityValid,
      canIncrement,
      canDecrement: line.quantity > 0,
    };
  }
}

function primaryMedia(product: Product | undefined): { url: string; alt: string } | null {
  if (!product) return null;
  const media = product.media.find((candidate) => candidate.id === product.primaryMediaId) ?? product.media[0];
  return media ? { url: media.url, alt: media.alt } : null;
}

function emptyCartView(): CartViewModel {
  return {
    status: "ACTIVE",
    items: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: DEFAULT_CART_CURRENCY },
    currency: DEFAULT_CART_CURRENCY,
    checkoutEligible: false,
    version: 0,
  };
}

export function createCartService(dependencies?: CartServiceDependencies) {
  return new CartService(dependencies);
}

export function encodeCartLineId(line: Pick<CartLine, "productId" | "variantId">): string {
  return Buffer.from(JSON.stringify({ productId: line.productId, variantId: line.variantId }), "utf8").toString("base64url");
}

export function parseCartLineId(lineId: string): Pick<CartLine, "productId" | "variantId"> {
  try {
    const decoded = JSON.parse(Buffer.from(lineId, "base64url").toString("utf8")) as unknown;
    return encodedLineSchema.parse(decoded);
  } catch (error) {
    throw validationError("Invalid cart line identity.");
  }
}

export function isVersionConflict(error: unknown): boolean {
  return error instanceof AuraError && error.code === ERROR_CODES.CONFLICT;
}

export function toValidationError(error: unknown): AuraError {
  if (error instanceof z.ZodError) return validationError("Cart input validation failed.");
  if (error instanceof AuraError) return error;
  return new AuraError(ERROR_CODES.INTERNAL_ERROR, "Unexpected cart service failure.", { cause: error });
}
