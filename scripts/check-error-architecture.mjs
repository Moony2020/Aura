import { z } from "zod";
import { ERROR_CODES } from "../src/lib/errors/error-codes.ts";
import { AuraError, insufficientInventoryError, invalidStateTransitionError } from "../src/lib/errors/aura-error.ts";
import { translateError } from "../src/lib/errors/translate.ts";
import { serializePublicError } from "../src/lib/errors/serialize.ts";
const duplicate = Object.assign(new Error("E11000 duplicate key collection=users uri=secret"), { code: 11000 });
const zod = (() => { try { z.object({ email: z.string().email() }).parse({ email: "bad" }); } catch (error) { return error; } })();
const cases = [translateError(zod), translateError(duplicate), translateError(invalidStateTransitionError("DELIVERED", "PENDING")), translateError(insufficientInventoryError("507f1f77bcf86cd799439011")), translateError(new Error("MongoServerError secret stack /db/password"))];
if (cases[0].code !== ERROR_CODES.VALIDATION_ERROR || cases[1].code !== ERROR_CODES.CONFLICT || cases[2].code !== ERROR_CODES.INVALID_STATE_TRANSITION || cases[3].code !== ERROR_CODES.INSUFFICIENT_INVENTORY || cases[4].code !== ERROR_CODES.INTERNAL_ERROR) throw new Error("Error translation taxonomy failed.");
for (const error of cases) { const output = serializePublicError(error); const text = JSON.stringify(output); if (text.includes("MongoServerError") || text.includes("password") || text.includes("stack")) throw new Error("Unsafe diagnostic data reached public serialization."); if (!output.code || !output.message || !output.status) throw new Error("Public error contract is incomplete."); }
const safe = serializePublicError(new AuraError(ERROR_CODES.DATABASE_ERROR, "secret internal diagnostic", { cause: new Error("private cause") })); if (safe.message !== "Unable to complete the request." || "cause" in safe) throw new Error("Internal cause leaked into public output.");
const first = JSON.stringify(serializePublicError(duplicate)); const second = JSON.stringify(serializePublicError(duplicate)); if (first !== second) throw new Error("Error serialization is not deterministic.");
console.log("PASS: error taxonomy, translation, safe serialization, redaction, and deterministic output are enforced.");
