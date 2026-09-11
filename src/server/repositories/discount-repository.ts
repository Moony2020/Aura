import type { Discount, DiscountCreateInput } from "../../domain/discount/discount.schema.ts";
export interface DiscountRepository { findById(id: string): Promise<Discount | null>; findByCode(code: string): Promise<Discount | null>; create(input: DiscountCreateInput): Promise<Discount>; count(): Promise<number>; }
