import fs from "node:fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const db = await getMongoDb();

const definitions = [
  {
    name: "authCredentials",
    validator: { $jsonSchema: { bsonType: "object", additionalProperties: false, required: ["userId", "passwordHash", "passwordHashVersion", "sessionVersion", "passwordChangedAt", "createdAt", "updatedAt"], properties: {
      _id: { bsonType: "objectId" }, userId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" }, passwordHash: { bsonType: "string", pattern: "^\\$argon2id\\$v=[0-9]+\\$m=[0-9]+,p=[0-9]+,t=[0-9]+\\$[A-Za-z0-9+/]+={0,2}\\$[A-Za-z0-9+/]+={0,2}$" }, passwordHashVersion: { bsonType: "int", minimum: 1 }, sessionVersion: { bsonType: "int", minimum: 0 }, passwordChangedAt: { bsonType: "date" }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" },
    } } },
    indexes: [[{ userId: 1 }, { name: "auth_credentials_user_unique", unique: true }]],
  },
  {
    name: "authTokens",
    validator: { $jsonSchema: { bsonType: "object", additionalProperties: false, required: ["userId", "purpose", "tokenHash", "expiresAt", "createdAt", "consumedAt"], properties: {
      _id: { bsonType: "objectId" }, userId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" }, purpose: { enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"] }, tokenHash: { bsonType: "string", pattern: "^[a-f0-9]{64}$" }, expiresAt: { bsonType: "date" }, createdAt: { bsonType: "date" }, consumedAt: { bsonType: ["date", "null"] },
    } } },
    indexes: [
      [{ tokenHash: 1 }, { name: "auth_tokens_hash_unique", unique: true }],
      [{ userId: 1, purpose: 1, consumedAt: 1, expiresAt: 1 }, { name: "auth_tokens_user_purpose_state" }],
      [{ expiresAt: 1 }, { name: "auth_tokens_expiry_cleanup", expireAfterSeconds: 0 }],
    ],
  },
];

for (const definition of definitions) {
  const exists = await db.listCollections({ name: definition.name }).toArray();
  if (!exists.length) await db.createCollection(definition.name, { validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  else await db.command({ collMod: definition.name, validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  for (const [key, options] of definition.indexes) await db.collection(definition.name).createIndex(key, options);
}

console.log("AUTH_COLLECTION_INITIALIZATION: PASS (authCredentials and authTokens; EMAIL_VERIFICATION only at repository boundary)");
await (await mongoClientPromise).close();
