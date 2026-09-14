import assert from "node:assert/strict";
import fs from "node:fs";

const projectStatus = fs.readFileSync("docs/PROJECT-STATUS.md", "utf8").split("\n").slice(0, 14).join("\n");
const masterPlan = fs.readFileSync("docs/MASTER-PLAN.md", "utf8");
const phase = fs.readFileSync("docs/phases/PHASE-04-AUTH-ACCOUNT.md", "utf8");
const contract = fs.readFileSync("docs/decisions/STAGE-4.9-GOAL-CONTRACT.md", "utf8");
const ledger = fs.readFileSync("docs/decisions/STAGE-4.9-PHASE-LEDGER.md", "utf8");

assert.match(projectStatus, /Current Stage:\*\* 4\.10 — Authentication Tests/);
assert.match(projectStatus, /\*\*Status:\*\* COMPLETE ✅/);
assert.match(projectStatus, /Goal Contract \/ Test Plan COMPLETE ✅ \/ Full Test Execution COMPLETE ✅/);
assert.match(projectStatus, /Stage 4\.10 — Authentication Tests ✅/);
assert.match(projectStatus, /Stage 4\.11 — Phase 4 Sign-Off: READY — NOT STARTED/);
assert.match(masterPlan, /\[x\] 4\.9 Authentication Security Hardening \(P0 Goal Contract, Owner Decisions, Phase Ledger, P1, P2, and P3 complete\)/);
assert.match(phase, /\[x\] 4\.9 Authentication Security Hardening \(P0\/Owner Decisions\/Phase Ledger\/P1\/P2\/P3 complete\)/);
assert.match(contract, /P0 Goal Contract COMPLETE ✅/);
assert.match(ledger, /Phase Ledger — P0-A2/);
assert.match(ledger, /P1 — Authentication Abuse Controls & Shared Rate-Limit Boundary/);
assert.match(ledger, /P2 — Transport, Session, Cookie, Cache & Redaction Hardening/);
assert.match(ledger, /P3 — Final Audit, Regression, Cleanup & Documentation/);
assert.match(ledger, /\*\*ATLAS_STOP:\*\* Awaiting owner approval before the next phase \(Stage 4\.10\)/);
assert.doesNotMatch(projectStatus, /Stage 4\.8 P2 — Login Integration/);

console.log("STAGE410_STATUS_CHECK: PASS (Stage 4.10 execution is complete and Stage 4.11 remains ready-not-started)");
