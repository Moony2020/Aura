import "server-only";

import {
  MongoClient,
  ServerApiVersion,
  type Db,
  type MongoClientOptions,
} from "mongodb";

import { requireServerEnv } from "../../config/env.server.ts";

const mongoClientOptions: MongoClientOptions = {
  appName: "aura-web",
  maxPoolSize: 10,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
};

type MongoGlobal = typeof globalThis & {
  _auraMongoClientPromise?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;

function createMongoClientPromise() {
  return new MongoClient(
    requireServerEnv("MONGODB_URI"),
    mongoClientOptions,
  ).connect();
}

export const mongoClientPromise =
  mongoGlobal._auraMongoClientPromise ?? createMongoClientPromise();

if (process.env.NODE_ENV !== "production") {
  mongoGlobal._auraMongoClientPromise = mongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  return (await mongoClientPromise).db();
}

export async function pingMongoDb(): Promise<void> {
  await (await mongoClientPromise).db("admin").command({ ping: 1 });
}
