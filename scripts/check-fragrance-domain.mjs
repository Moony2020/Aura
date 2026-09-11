import { productFragranceFamiliesInputSchema, productFragranceNotesInputSchema } from "../src/domain/fragrance/fragrance.schema.ts";
const id = "507f1f77bcf86cd799439011"; const note = "507f1f77bcf86cd799439012";
productFragranceNotesInputSchema.parse({ notes: [{ noteId: note, tier: "TOP", position: 0 }, { noteId: id, tier: "HEART", position: 0 }] });
productFragranceFamiliesInputSchema.parse({ families: [{ familyId: id, position: 0 }] });
for (const invalid of [{ notes: [{ noteId: note, tier: "TOP", position: 0 }, { noteId: note, tier: "TOP", position: 1 }] }, { notes: [{ noteId: note, tier: "BAD", position: 0 }] }, { families: [{ familyId: id, position: 0 }, { familyId: id, position: 1 }] }]) { let rejected = false; try { ("families" in invalid ? productFragranceFamiliesInputSchema : productFragranceNotesInputSchema).parse(invalid); } catch { rejected = true; } if (!rejected) throw new Error("Invalid taxonomy input was accepted."); }
console.log("PASS: fragrance taxonomy validation and ordering rules are enforced.");
