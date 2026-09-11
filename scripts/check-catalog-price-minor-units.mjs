import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const client = new MongoClient(uri, { appName: "aura-catalog-price-minor-unit-check", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect();
try {
  const products = client.db().collection("products");
  const legacy = await products.aggregate([
    { $match: { status: "PUBLISHED", audience: { $in: ["WOMEN", "MEN", "UNISEX"] } } },
    { $unwind: "$variants" },
    { $match: { "variants.isActive": true, "variants.price.currency": "USD", "variants.price.amount": { $lt: 1000 } } },
    { $project: { _id: 0, slug: 1, sku: "$variants.sku", amount: "$variants.price.amount" } },
  ]).toArray();
  if (legacy.length) throw new Error(`Published catalog variants still have legacy major-unit prices: ${JSON.stringify(legacy)}`);

  const examples = await products.find({ slug: { $in: ["elixir-de-rose", "velvet-rose", "oud-majeste"] } }).toArray();
  const amountFor = (slug, volumeMl) => examples.find((product) => product.slug === slug)?.variants.find((variant) => variant.volumeMl === volumeMl)?.price.amount;
  for (const [slug, volumeMl, expected] of [["elixir-de-rose", 100, 12900], ["velvet-rose", 50, 7500], ["oud-majeste", 100, 15900]]) {
    const actual = amountFor(slug, volumeMl);
    if (actual !== expected) throw new Error(`Expected ${slug} ${volumeMl}ml to be ${expected} minor units; found ${actual}.`);
  }

  console.log("PASS: published catalog sellable variants use USD integer minor units; examples 7500/12900/15900 verified.");
} finally {
  await client.close();
}

