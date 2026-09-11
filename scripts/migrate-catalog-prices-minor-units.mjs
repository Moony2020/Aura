import fs from "node:fs";
import crypto from "node:crypto";
import { MongoClient, ServerApiVersion } from "mongodb";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const catalog = [
  ["Élixir de Rose", 100, 129], ["Velvet Rose", 75, 99], ["Jasmine Nocturne", 100, 119], ["Fleur de Lune", 50, 79], ["Rose Impériale", 75, 139], ["Ambre Féminin", 100, 125], ["Pivoine Céleste", 75, 95], ["Vanille de Minuit", 50, 109], ["Orchidée Royale", 100, 119], ["Nuit de Velours", 75, 105],
  ["Oud Majesté", 100, 159], ["Bois Noir", 100, 115], ["Cuir Impérial", 75, 109], ["Vetiver Obscur", 100, 109], ["Santal Royale", 75, 139], ["Noir d'Ambre", 100, 129], ["Cèdre Sauvage", 50, 75], ["Tabac de Nuit", 75, 135], ["Azure Vetiver", 100, 95], ["L'Homme Sombre", 100, 115],
  ["Sable d'Or", 100, 125], ["Nuit Glacée", 75, 99], ["L'Arcane Sacré", 100, 159], ["Bleu Majesté", 100, 119], ["Midnight Velvet", 75, 109], ["Musc Éternel", 50, 105], ["Citrus Vetiver", 100, 105], ["Amber Horizon", 75, 109], ["Oud Lumière", 100, 155], ["Éclat de Neroli", 50, 75],
];
const extraVariants = { "velvet-rose": [[50, 75], [100, 119]], "elixir-de-rose": [[50, 79], [75, 105]], "oud-majeste": [[50, 105], [75, 135]] };
const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const uuidFor = (value) => { const hex = crypto.createHash("sha256").update(value).digest("hex").slice(0, 32).split(""); hex[12] = "4"; hex[16] = (Number.parseInt(hex[16], 16) & 3 | 8).toString(16); return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`; };
const minorUnits = (majorUnits) => majorUnits * 100;

const expectedBySlug = new Map(catalog.map(([name, defaultVolume, defaultPrice]) => {
  const slug = slugify(name);
  const variants = new Map([[defaultVolume, defaultPrice], ...(extraVariants[slug] ?? [])].map(([volumeMl, majorAmount]) => [uuidFor(`variant:${slug}:${volumeMl}`), { volumeMl, majorAmount, minorAmount: minorUnits(majorAmount) }]));
  return [slug, variants];
}));

const client = new MongoClient(uri, { appName: "aura-catalog-price-minor-unit-migration", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect();
try {
  const products = client.db().collection("products");
  let updatedProducts = 0;
  let updatedVariants = 0;

  for (const [slug, expectedVariants] of expectedBySlug) {
    const product = await products.findOne({ slug });
    if (!product) throw new Error(`Missing catalog product: ${slug}`);
    const variants = product.variants.map((variant) => {
      const expected = expectedVariants.get(variant.id);
      if (!expected) return variant;
      const actual = variant.price?.amount;
      if (actual === expected.minorAmount) return variant;
      if (actual === expected.majorAmount) {
        updatedVariants += 1;
        return { ...variant, price: { ...variant.price, amount: expected.minorAmount } };
      }
      throw new Error(`Unexpected price for ${slug} ${expected.volumeMl}ml: ${actual}; expected ${expected.majorAmount} or ${expected.minorAmount}.`);
    });
    if (JSON.stringify(variants) !== JSON.stringify(product.variants)) {
      updatedProducts += 1;
      await products.updateOne({ _id: product._id }, { $set: { variants, updatedAt: new Date() } });
    }
  }

  const legacyAmounts = await products.aggregate([
    { $match: { status: "PUBLISHED", slug: { $in: [...expectedBySlug.keys()] } } },
    { $unwind: "$variants" },
    { $match: { "variants.isActive": true, "variants.price.amount": { $lt: 1000 } } },
    { $project: { slug: 1, amount: "$variants.price.amount", sku: "$variants.sku" } },
  ]).toArray();
  if (legacyAmounts.length) throw new Error(`Legacy major-unit prices remain: ${JSON.stringify(legacyAmounts)}`);

  const examples = await products.find({ slug: { $in: ["elixir-de-rose", "velvet-rose", "oud-majeste"] } }).toArray();
  const amountFor = (slug, volumeMl) => examples.find((product) => product.slug === slug)?.variants.find((variant) => variant.volumeMl === volumeMl)?.price.amount;
  const assertions = [
    ["elixir-de-rose", 100, 12900],
    ["velvet-rose", 50, 7500],
    ["velvet-rose", 75, 9900],
    ["velvet-rose", 100, 11900],
    ["oud-majeste", 100, 15900],
  ];
  for (const [slug, volumeMl, expected] of assertions) {
    const actual = amountFor(slug, volumeMl);
    if (actual !== expected) throw new Error(`Price verification failed for ${slug} ${volumeMl}ml: ${actual} !== ${expected}`);
  }

  console.log(`PASS: catalog prices use integer minor units; updated ${updatedVariants} variant(s) across ${updatedProducts} product(s), and no published catalog variant remains in legacy major units.`);
} finally {
  await client.close();
}

