import type { Cart, CartLine } from "../../domain/cart/cart.schema.ts";

export type CreateGuestCartInput = {
  guestTokenHash: string;
  expiresAt: Date;
  initialItems?: CartLine[];
};

export type CreateUserCartInput = {
  userId: string;
  initialItems?: CartLine[];
};

export type CartMutationOptions = {
  expectedVersion?: number;
  expiresAt?: Date;
};

export type AddOrIncrementLineInput = CartLine & CartMutationOptions;
export type SetLineQuantityInput = Omit<CartLine, "quantity"> & {
  quantity: number;
} & CartMutationOptions;
export type RemoveLineInput = Omit<CartLine, "quantity"> & CartMutationOptions;

export interface CartRepository {
  findById(id: string): Promise<Cart | null>;
  findActiveGuestCartByTokenHash(guestTokenHash: string): Promise<Cart | null>;
  findActiveUserCart(userId: string): Promise<Cart | null>;
  createGuestCart(input: CreateGuestCartInput): Promise<Cart>;
  createUserCart(input: CreateUserCartInput): Promise<Cart>;
  addOrIncrementLine(cartId: string, input: AddOrIncrementLineInput): Promise<Cart>;
  setLineQuantity(cartId: string, input: SetLineQuantityInput): Promise<Cart>;
  removeLine(cartId: string, input: RemoveLineInput): Promise<Cart>;
  clearLines(cartId: string, options?: CartMutationOptions): Promise<Cart>;
  markExpired(cartId: string): Promise<Cart | null>;
}
