import fs from "node:fs";
if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) { const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry)); if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, ""); }
const { getMongoDb } = await import("../src/server/db/mongodb.ts"); const db = await getMongoDb(); const indexes = await db.collection("discounts").indexes();
for (const name of ["discounts_code_unique", "discounts_status"]) if (!indexes.some((index) => index.name === name)) throw new Error(`Missing discount index: ${name}`);
console.log(`DISCOUNT_COLLECTION_CHECK: PASS (documents=${await db.collection("discounts").countDocuments()})`);
process.exit(0);
