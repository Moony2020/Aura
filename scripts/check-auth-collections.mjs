import fs from "node:fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const db = await getMongoDb();
const expected = {
  authCredentials: { required: ["userId", "passwordHash", "passwordHashVersion", "sessionVersion", "passwordChangedAt", "createdAt", "updatedAt"], indexes: ["auth_credentials_user_unique"] },
  authTokens: { required: ["userId", "purpose", "tokenHash", "expiresAt", "createdAt", "consumedAt"], indexes: ["auth_tokens_hash_unique", "auth_tokens_user_purpose_state", "auth_tokens_expiry_cleanup"] },
};

for (const [name, contract] of Object.entries(expected)) {
  const collection = (await db.listCollections({ name }, { nameOnly: false }).toArray())[0];
  if (!collection) throw new Error(`Missing ${name} collection.`);
  const schema = collection.options?.validator?.$jsonSchema;
  if (schema?.additionalProperties !== false) throw new Error(`${name} validator is not strict.`);
  for (const field of contract.required) if (!schema.required.includes(field)) throw new Error(`${name} validator is missing ${field}.`);
  const indexes = new Set((await db.collection(name).listIndexes().toArray()).map((index) => index.name));
  for (const index of contract.indexes) if (!indexes.has(index)) throw new Error(`Missing ${name} index ${index}.`);
}

const authCredentialSchema = (await db.listCollections({ name: "authCredentials" }, { nameOnly: false }).toArray())[0].options.validator.$jsonSchema;
const authTokenSchema = (await db.listCollections({ name: "authTokens" }, { nameOnly: false }).toArray())[0].options.validator.$jsonSchema;
if (authCredentialSchema.properties.passwordHash.pattern.includes("argon2id") === false) throw new Error("authCredentials passwordHash validator is not Argon2id-only.");
if (!authTokenSchema.properties.purpose.enum.includes("EMAIL_VERIFICATION") || !authTokenSchema.properties.purpose.enum.includes("PASSWORD_RESET")) throw new Error("authTokens purpose separation is incomplete.");

console.log("AUTH_COLLECTION_CHECK: PASS (strict validators, Argon2id contract, purpose separation, and expected indexes)");
await (await mongoClientPromise).close();
