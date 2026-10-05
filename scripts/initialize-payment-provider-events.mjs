import fs from "node:fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { ensurePaymentProviderEventsCollection } = await import("../src/server/repositories/mongo-payment-provider-event-repository.ts");
await ensurePaymentProviderEventsCollection(await getMongoDb());
console.log("PAYMENT_PROVIDER_EVENTS_INITIALIZATION: PASS (strict validator, unique provider/event index, finalized expiry index)");
await (await mongoClientPromise).close();
