import fs from "node:fs";

import { MongoClient, ServerApiVersion } from "mongodb";

function readLocalEnvironmentValue(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  if (!fs.existsSync(".env.local")) {
    return undefined;
  }

  const entry = fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line));

  return entry
    ?.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "")
    .trim()
    .replace(/^"|"$/g, "");
}

const uri = readLocalEnvironmentValue("MONGODB_URI");

if (!uri) {
  console.error("MONGODB_CONNECTION_CHECK: MONGODB_URI is unavailable.");
  process.exitCode = 1;
} else {
  const client = new MongoClient(uri, {
    appName: "aura-stage-1-4-check",
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    await client.db("admin").command({ ping: 1 });
    console.log("MONGODB_CONNECTION_CHECK: PASS");
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`MONGODB_CONNECTION_CHECK: FAIL (${errorName})`);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
