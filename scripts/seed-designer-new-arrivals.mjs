import fs from "node:fs";
import crypto from "node:crypto";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const idFor = (value) => new ObjectId(crypto.createHash("sha256").update(value).digest("hex").slice(0, 24));
const uuidFor = (value) => {
  const hex = crypto.createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = (Number.parseInt(hex[16], 16) & 3 | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};

const designerProducts = [
  {
    slug: "dior-sauvage-edp",
    name: "Sauvage Eau de Parfum",
    brand: "Dior",
    audience: "MEN",
    description: "An intensely fresh composition, dictated by a name that has the ring of a manifesto. Radiant top notes burst with the juicy freshness of Calabrian bergamot, while Ambroxan unleashes a powerfully woody trail.",
    notesSummary: "Woody · Fresh · Spicy",
    image: "/assets/prod-sauvage.jpg",
    variants: [
      { volumeMl: 30, price: 85, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 60, price: 110, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 100, price: 145, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 200, price: 205, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "bleu-de-chanel-edp",
    name: "Bleu de Chanel Eau de Parfum",
    brand: "Chanel",
    audience: "MEN",
    description: "An ode to masculine freedom expressed in an aromatic-woody fragrance with a captivating trail. A timeless, non-conformist scent housed in an enigmatic blue bottle.",
    notesSummary: "Citrus · Woody · Aromatic",
    image: "/assets/prod-bleu-chanel.jpg",
    variants: [
      { volumeMl: 50, price: 105, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 100, price: 129, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 150, price: 165, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "armani-my-way-edp",
    name: "My Way Eau de Parfum",
    brand: "Giorgio Armani",
    audience: "WOMEN",
    description: "An invitation to broaden your horizons and live meaningful encounters around the world. Bergamot meets orange blossom from Egypt in a luminous, sparkling start.",
    notesSummary: "Floral · Citrus · Vanilla",
    image: "/assets/prod-my-way.jpg",
    variants: [
      { volumeMl: 30, price: 90, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 50, price: 125, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 90, price: 160, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "paco-rabanne-1-million-edt",
    name: "1 Million Eau de Toilette",
    brand: "Rabanne",
    audience: "MEN",
    description: "The scent of insolence. An intoxicating, powerful blend. Starts fresh — moves into spicy leather. An arresting alchemy of full-on seduction.",
    notesSummary: "Warm · Spicy · Leather",
    image: "/assets/prod-million.jpg",
    variants: [
      { volumeMl: 50, price: 85, concentration: "EAU_DE_TOILETTE" },
      { volumeMl: 100, price: 99, concentration: "EAU_DE_TOILETTE" },
      { volumeMl: 200, price: 145, concentration: "EAU_DE_TOILETTE" },
    ],
  },
  {
    slug: "acqua-di-gio-profondo-edp",
    name: "Acqua di Giò Profondo EDP",
    brand: "Giorgio Armani",
    audience: "MEN",
    description: "The contemporary and intense masculine interpretation of Acqua di Giò. Unveiling a deep marine freshness, aromatic essences, and a woody mineral accord.",
    notesSummary: "Marine · Aquatic · Woody",
    image: "/assets/prod-acqua-gio.jpg",
    variants: [
      { volumeMl: 50, price: 95, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 100, price: 113, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 200, price: 165, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "ysl-black-opium-edp",
    name: "Black Opium Eau de Parfum",
    brand: "Yves Saint Laurent",
    audience: "WOMEN",
    description: "A glam rock fragrance full of mystery and energy. An addictive gourmand floral with notes of black coffee, white florals, and sweet vanilla.",
    notesSummary: "Coffee · Vanilla · White Floral",
    image: "/assets/prod-black-opium.jpg",
    variants: [
      { volumeMl: 30, price: 95, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 50, price: 145, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 90, price: 195, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "hugo-boss-boss-bottled-edp",
    name: "BOSS Bottled Eau de Parfum",
    brand: "Hugo Boss",
    audience: "MEN",
    description: "Created for driven, ambitious men ready to take on every challenge that comes their way. A noble composition bringing intensity to the classic BOSS Bottled signature.",
    notesSummary: "Apple · Cinnamon · Woody",
    image: "/assets/prod-boss-bottled.jpg",
    variants: [
      { volumeMl: 50, price: 75, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 100, price: 89, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 200, price: 125, concentration: "EAU_DE_PARFUM" },
    ],
  },
  {
    slug: "versace-eros-edp",
    name: "Versace Eros Eau de Parfum",
    brand: "Versace",
    audience: "MEN",
    description: "Eros embodies masculine strength and passion. A bold oriental woody scent that brings out vibrant citrus, aromatic mint, crisp green apple, and creamy vanilla with cedarwood.",
    notesSummary: "Woody · Mint · Vanilla",
    image: "/assets/prod-sauvage.jpg",
    variants: [
      { volumeMl: 50, price: 92, concentration: "EAU_DE_PARFUM" },
      { volumeMl: 100, price: 118, concentration: "EAU_DE_PARFUM" },
    ],
  },
];

const client = new MongoClient(uri, {
  appName: "aura-designer-new-arrivals-seed",
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10000,
});

await client.connect();
const db = client.db();
const products = db.collection("products");
const inventory = db.collection("inventories");
const now = new Date();

try {
  for (const item of designerProducts) {
    const variants = item.variants.map((v) => ({
      id: uuidFor(`variant:${item.slug}:${v.volumeMl}`),
      sku: `AURA-${item.slug.toUpperCase().replace(/-/g, "-")}-${v.volumeMl}`,
      name: `${v.volumeMl}ml`,
      volumeMl: v.volumeMl,
      concentration: v.concentration,
      price: { amount: v.price * 100, currency: "USD" },
      isActive: true,
    }));

    const media = [
      {
        id: uuidFor(`media:${item.slug}`),
        kind: "IMAGE",
        provider: "EXTERNAL",
        url: item.image,
        alt: `${item.brand} ${item.name}`,
        position: 0,
      },
    ];

    const document = {
      _id: idFor(`product:${item.slug}`),
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      description: item.description,
      status: "PUBLISHED",
      audience: item.audience,
      variants,
      media,
      launchAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await products.replaceOne({ slug: item.slug }, document, { upsert: true });

    // Seed inventory so products are in stock
    for (const v of variants) {
      await inventory.updateOne(
        { variantId: v.id },
        {
          $set: {
            variantId: v.id,
            sku: v.sku,
            quantity: 50,
            reserved: 0,
            available: 50,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }
  }

  console.log("PASS: 8 designer new arrivals seeded with full variants, inventory, and media.");
} finally {
  await client.close();
}
