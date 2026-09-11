import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { discountCreateSchema, discountSchema, type Discount, type DiscountCreateInput } from "../../domain/discount/discount.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type { DiscountRepository } from "./discount-repository.ts";
type Doc = Omit<Discount, "id"> & { _id: ObjectId };
const toDiscount = (doc: Doc): Discount => { const { _id, ...rest } = doc; return discountSchema.parse({ ...rest, id: _id.toHexString() }); };
export class MongoDiscountRepository implements DiscountRepository {
  private async collection(): Promise<Collection<Doc>> { return (await getMongoDb()).collection<Doc>("discounts"); }
  async findById(id: string) { if (!ObjectId.isValid(id)) return null; const doc = await (await this.collection()).findOne({ _id: new ObjectId(id) }); return doc ? toDiscount(doc) : null; }
  async findByCode(code: string) { const doc = await (await this.collection()).findOne({ code: code.trim().toUpperCase() }); return doc ? toDiscount(doc) : null; }
  async create(input: DiscountCreateInput) { const parsed = discountCreateSchema.parse(input); const now = new Date(); const doc: Doc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; await (await this.collection()).insertOne(doc); return toDiscount(doc); }
  async count() { return (await this.collection()).countDocuments(); }
}
