import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export default undefined;",
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("@/")) {
    return {
      url: pathToFileURL(path.resolve(process.cwd(), "src", `${specifier.slice(2)}.ts`)).href,
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("next/")) {
    const candidate = path.resolve(process.cwd(), "node_modules", `${specifier}.js`);
    if (fs.existsSync(candidate)) {
      return {
        url: pathToFileURL(candidate).href,
        shortCircuit: true,
      };
    }
  }

  if (specifier === "next/server") {
    return {
      url: pathToFileURL(path.resolve(process.cwd(), "node_modules", "next", "server.js")).href,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
