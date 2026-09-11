import "server-only";
import { ObjectId, type Collection as MongoCollection } from "mongodb";
import { fragranceFamilyCreateSchema, fragranceFamilySchema, fragranceNoteCreateSchema, fragranceNoteSchema, productFragranceFamiliesInputSchema, productFragranceNotesInputSchema, type FragranceFamily, type FragranceFamilyCreateInput, type FragranceNote, type FragranceNoteCreateInput, type ProductFragranceFamily, type ProductFragranceNote } from "@/domain/fragrance/fragrance.schema";
import { getMongoDb } from "@/server/db/mongodb";
import type { FragranceFamilyRepository, FragranceNoteRepository, ProductFragranceTaxonomyRepository } from "./fragrance-repository";
import { MongoProductRepository } from "./mongo-product-repository";

type NoteDoc = Omit<FragranceNote, "id"> & { _id: ObjectId }; type FamilyDoc = Omit<FragranceFamily, "id"> & { _id: ObjectId };
type NoteLinkDoc = ProductFragranceNote & { _id?: ObjectId }; type FamilyLinkDoc = ProductFragranceFamily & { _id?: ObjectId };
const ids = (values: string[]) => values.map((value) => new ObjectId(value));
export class MongoFragranceNoteRepository implements FragranceNoteRepository {
  private async c(): Promise<MongoCollection<NoteDoc>> { return (await getMongoDb()).collection("fragranceNotes"); }
  async findByIds(values: string[]) { if (!values.length) return []; const rows = await (await this.c()).find({ _id: { $in: ids(values) } }).toArray(); return rows.map((row) => fragranceNoteSchema.parse({ ...row, id: row._id.toHexString() })); }
  async findBySlug(slug: string) { const row = await (await this.c()).findOne({ slug }); return row ? fragranceNoteSchema.parse({ ...row, id: row._id.toHexString() }) : null; }
  async create(input: FragranceNoteCreateInput) { const parsed = fragranceNoteCreateSchema.parse(input); const now = new Date(); const row: NoteDoc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; await (await this.c()).insertOne(row); return fragranceNoteSchema.parse({ ...row, id: row._id.toHexString() }); }
}
export class MongoFragranceFamilyRepository implements FragranceFamilyRepository {
  private async c(): Promise<MongoCollection<FamilyDoc>> { return (await getMongoDb()).collection("fragranceFamilies"); }
  async findByIds(values: string[]) { if (!values.length) return []; const rows = await (await this.c()).find({ _id: { $in: ids(values) } }).toArray(); return rows.map((row) => fragranceFamilySchema.parse({ ...row, id: row._id.toHexString() })); }
  async findBySlug(slug: string) { const row = await (await this.c()).findOne({ slug }); return row ? fragranceFamilySchema.parse({ ...row, id: row._id.toHexString() }) : null; }
  async create(input: FragranceFamilyCreateInput) { const parsed = fragranceFamilyCreateSchema.parse(input); const now = new Date(); const row: FamilyDoc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; await (await this.c()).insertOne(row); return fragranceFamilySchema.parse({ ...row, id: row._id.toHexString() }); }
}
export class MongoProductFragranceTaxonomyRepository implements ProductFragranceTaxonomyRepository {
  private readonly products = new MongoProductRepository(); private readonly notes = new MongoFragranceNoteRepository(); private readonly families = new MongoFragranceFamilyRepository();
  private async notesCollection(): Promise<MongoCollection<NoteLinkDoc>> { return (await getMongoDb()).collection("productFragranceNotes"); }
  private async familiesCollection(): Promise<MongoCollection<FamilyLinkDoc>> { return (await getMongoDb()).collection("productFragranceFamilies"); }
  async replaceProductNotes(productId: string, notes: Omit<ProductFragranceNote, "productId">[]) { productId = new ObjectId(productId).toHexString(); productFragranceNotesInputSchema.parse({ notes }); if ((await this.products.findByIds([productId])).length !== 1) throw new Error("Product reference does not exist."); if ((await this.notes.findByIds(notes.map((note) => note.noteId))).length !== new Set(notes.map((note) => note.noteId)).size) throw new Error("Fragrance note reference does not exist."); const c = await this.notesCollection(); await c.deleteMany({ productId }); const docs = notes.map((note) => ({ ...note, productId })); if (docs.length) await c.insertMany(docs); return docs; }
  async replaceProductFamilies(productId: string, families: Omit<ProductFragranceFamily, "productId">[]) { productId = new ObjectId(productId).toHexString(); productFragranceFamiliesInputSchema.parse({ families }); if ((await this.products.findByIds([productId])).length !== 1) throw new Error("Product reference does not exist."); if ((await this.families.findByIds(families.map((family) => family.familyId))).length !== new Set(families.map((family) => family.familyId)).size) throw new Error("Fragrance family reference does not exist."); const c = await this.familiesCollection(); await c.deleteMany({ productId }); const docs = families.map((family) => ({ ...family, productId })); if (docs.length) await c.insertMany(docs); return docs; }
  async listProductNotes(productId: string) { return (await (await this.notesCollection()).find({ productId }).sort({ tier: 1, position: 1 }).toArray()); }
  async listNotesByProductIds(productIds: string[]) { if (!productIds.length) return []; return (await (await this.notesCollection()).find({ productId: { $in: productIds } }).sort({ productId: 1, tier: 1, position: 1 }).toArray()); }
  async listProductFamilies(productId: string) { return (await (await this.familiesCollection()).find({ productId }).sort({ position: 1 }).toArray()); }
  async listFamiliesByProductIds(productIds: string[]) { if (!productIds.length) return []; return (await (await this.familiesCollection()).find({ productId: { $in: productIds } }).sort({ position: 1 }).toArray()); }
}
