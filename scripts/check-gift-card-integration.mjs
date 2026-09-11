import fs from "node:fs";
if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) { const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry)); if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, ""); }
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { createGiftCardService } = await import("../src/server/gift-card/gift-card-service.ts");
const { hashGiftCardCode } = await import("../src/server/gift-card/gift-card-token.ts");
const db = await getMongoDb(); const service = createGiftCardService(); const createdIds = [];
try {
  const issued = await service.issueGiftCard({ initialBalanceMinor: 5000, currency: "USD" }); createdIds.push(issued.card.id);
  const stored = await db.collection("giftCards").findOne({ _id: { $eq: (await import("mongodb")).ObjectId.createFromHexString(issued.card.id) } });
  const transactions = await db.collection("giftCardTransactions").find({ giftCardId: issued.card.id }).toArray();
  const serialized = JSON.stringify({ card: issued.card, transaction: issued.transaction });
  if (!stored || stored.codeHash !== hashGiftCardCode(issued.rawCode) || serialized.includes(issued.rawCode) || JSON.stringify(stored).includes(issued.rawCode) || transactions.some((entry) => JSON.stringify(entry).includes(issued.rawCode))) throw new Error("Raw Gift Card code was persisted or leaked.");
  const first = await service.redeemGiftCard(issued.rawCode, 3000, "stage39-partial", "USD");
  const repeated = await service.redeemGiftCard(issued.rawCode, 3000, "stage39-partial", "USD");
  if (first.redeemedAmountMinor !== 3000 || repeated.redeemedAmountMinor !== 3000) throw new Error("Idempotent redemption result failed.");
  const concurrent = await Promise.allSettled([service.redeemGiftCard(issued.rawCode, 4000, "stage39-concurrent-a", "USD"), service.redeemGiftCard(issued.rawCode, 4000, "stage39-concurrent-b", "USD")]);
  const accepted = concurrent.filter((result) => result.status === "fulfilled").map((result) => result.value.redeemedAmountMinor).reduce((sum, amount) => sum + amount, 0);
  const cardAfter = await db.collection("giftCards").findOne({ _id: (await import("mongodb")).ObjectId.createFromHexString(issued.card.id) });
  const ledger = await db.collection("giftCardTransactions").find({ giftCardId: issued.card.id }).sort({ createdAt: 1 }).toArray();
  const redeemed = ledger.filter((entry) => entry.type === "REDEEM").reduce((sum, entry) => sum + entry.amountMinor, 0);
  if (accepted > 2000 || !cardAfter || cardAfter.remainingBalanceMinor < 0 || cardAfter.remainingBalanceMinor !== 5000 - redeemed || ledger[0]?.balanceBeforeMinor !== 0 || ledger[0]?.balanceAfterMinor !== 5000) throw new Error("Concurrent redemption or ledger reconciliation failed.");
  if (new Set(ledger.filter((entry) => entry.reference).map((entry) => entry.reference)).size !== ledger.filter((entry) => entry.reference).length) throw new Error("Duplicate redemption ledger reference detected.");
  console.log(`GIFT_CARD_INTEGRATION_CHECK: PASS (accepted_concurrent_minor=${accepted}, remaining_minor=${cardAfter.remainingBalanceMinor}, ledger_entries=${ledger.length})`);
} finally {
  if (createdIds.length) { const { ObjectId } = await import("mongodb"); await db.collection("giftCardTransactions").deleteMany({ giftCardId: { $in: createdIds } }); await db.collection("giftCards").deleteMany({ _id: { $in: createdIds.map((id) => new ObjectId(id)) } }); }
  const remainingCards = await db.collection("giftCards").countDocuments(); const remainingTransactions = await db.collection("giftCardTransactions").countDocuments(); if (remainingCards !== 0 || remainingTransactions !== 0) throw new Error(`Gift Card fixture cleanup failed: cards=${remainingCards}, transactions=${remainingTransactions}`); await (await mongoClientPromise).close();
}
