import fs from "node:fs";
import crypto from "node:crypto";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const catalog = [
  ["Élixir de Rose", "women", "EAU_DE_PARFUM_INTENSE", 100, 129], ["Velvet Rose", "women", "EAU_DE_PARFUM", 75, 99], ["Jasmine Nocturne", "women", "EAU_DE_PARFUM", 100, 119], ["Fleur de Lune", "women", "EAU_DE_PARFUM", 50, 79], ["Rose Impériale", "women", "EXTRAIT_DE_PARFUM", 75, 139], ["Ambre Féminin", "women", "EAU_DE_PARFUM_INTENSE", 100, 125], ["Pivoine Céleste", "women", "EAU_DE_PARFUM", 75, 95], ["Vanille de Minuit", "women", "EXTRAIT_DE_PARFUM", 50, 109], ["Orchidée Royale", "women", "EAU_DE_PARFUM", 100, 119], ["Nuit de Velours", "women", "EAU_DE_PARFUM_INTENSE", 75, 105],
  ["Oud Majesté", "men", "EXTRAIT_DE_PARFUM", 100, 159], ["Bois Noir", "men", "EAU_DE_PARFUM", 100, 115], ["Cuir Impérial", "men", "EAU_DE_PARFUM_INTENSE", 75, 109], ["Vetiver Obscur", "men", "EAU_DE_PARFUM", 100, 109], ["Santal Royale", "men", "EXTRAIT_DE_PARFUM", 75, 139], ["Noir d'Ambre", "men", "EAU_DE_PARFUM_INTENSE", 100, 129], ["Cèdre Sauvage", "men", "EAU_DE_PARFUM", 50, 75], ["Tabac de Nuit", "men", "EXTRAIT_DE_PARFUM", 75, 135], ["Azure Vetiver", "men", "EAU_DE_TOILETTE", 100, 95], ["L'Homme Sombre", "men", "EAU_DE_PARFUM", 100, 115],
  ["Sable d'Or", "unisex", "EAU_DE_PARFUM", 100, 125], ["Nuit Glacée", "unisex", "EAU_DE_PARFUM", 75, 99], ["L'Arcane Sacré", "unisex", "EXTRAIT_DE_PARFUM", 100, 159], ["Bleu Majesté", "unisex", "EAU_DE_PARFUM", 100, 119], ["Midnight Velvet", "unisex", "EAU_DE_PARFUM_INTENSE", 75, 109], ["Musc Éternel", "unisex", "EXTRAIT_DE_PARFUM", 50, 105], ["Citrus Vetiver", "unisex", "EAU_DE_PARFUM", 100, 105], ["Amber Horizon", "unisex", "EAU_DE_PARFUM_INTENSE", 75, 109], ["Oud Lumière", "unisex", "EXTRAIT_DE_PARFUM", 100, 155], ["Éclat de Neroli", "unisex", "EAU_DE_PARFUM", 50, 75],
];
const extraVariants = { "velvet-rose": [[50, 75], [100, 119]], "elixir-de-rose": [[50, 79], [75, 105]], "oud-majeste": [[50, 105], [75, 135]] };
const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const idFor = (value) => new ObjectId(crypto.createHash("sha256").update(value).digest("hex").slice(0, 24));
const uuidFor = (value) => { const hex = crypto.createHash("sha256").update(value).digest("hex").slice(0, 32).split(""); hex[12] = "4"; hex[16] = (Number.parseInt(hex[16], 16) & 3 | 8).toString(16); return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`; };
const audienceFor = (value) => value.toUpperCase();
const minorUnits = (majorUnits) => majorUnits * 100;
const client = new MongoClient(uri, { appName: "aura-accessible-luxury-catalog-migration", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db(); const products = db.collection("products"); const collections = db.collection("collections"); const now = new Date();
try {
  if (catalog.length !== 30 || new Set(catalog.map(([name]) => slugify(name))).size !== 30) throw new Error("Catalog must contain exactly 30 unique products.");
  for (const [name, audience, concentration, defaultVolume, defaultPrice] of catalog) {
    const slug = slugify(name); const variants = [[defaultVolume, defaultPrice], ...(extraVariants[slug] ?? [])].map(([volumeMl, amount]) => ({ id: uuidFor(`variant:${slug}:${volumeMl}`), sku: `AURA-${slug.toUpperCase().replace(/-/g, "-")}-${volumeMl}`, name: `${volumeMl}ml`, volumeMl, concentration, price: { amount: minorUnits(amount), currency: "USD" }, isActive: true }));
    const existing = await products.findOne({ slug });
    const document = { ...(existing ?? { _id: idFor(`product:${slug}`), brand: "AURA", media: [], createdAt: now }), slug, name, description: existing?.description ?? `An AURA ${audience} fragrance composed for an unforgettable signature.`, status: "PUBLISHED", audience: audienceFor(audience), variants, updatedAt: now };
    await products.replaceOne({ slug }, document, { upsert: true });
  }
  for (const slug of ["noir-cashmere", "amber-mystique", "golden-santal"]) await products.updateOne({ slug }, { $set: { status: "ARCHIVED", updatedAt: now } });
  await collections.updateOne({ slug: "cinematic-worlds" }, { $set: { visibility: "HIDDEN", updatedAt: now } });
  const counts = await products.aggregate([{ $match: { status: "PUBLISHED", audience: { $in: ["WOMEN", "MEN", "UNISEX"] } } }, { $group: { _id: "$audience", count: { $sum: 1 } } }]).toArray();
  const countMap = new Map(counts.map((row) => [row._id, row.count]));
  if (countMap.get("WOMEN") !== 10 || countMap.get("MEN") !== 10 || countMap.get("UNISEX") !== 10) throw new Error("Audience counts did not converge to 10/10/10.");
  console.log("PASS: accessible-luxury catalog migration complete; 30 canonical products, 10/10/10 audiences, and legacy products archived without deletion.");
} finally { await client.close(); }
