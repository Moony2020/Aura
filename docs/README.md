# AURA Engineering Documentation

This directory is the authoritative technical memory for AURA. Conversation history is not a source of project status.

## Resume Protocol

Every development session must read, in order:

1. [PROJECT-STATUS.md](./PROJECT-STATUS.md)
2. [MASTER-PLAN.md](./MASTER-PLAN.md)
3. The current document in [`phases/`](./phases/)
4. Relevant accepted decisions in [decisions/ARCHITECTURE-DECISIONS.md](./decisions/ARCHITECTURE-DECISIONS.md)

## Documentation Map

- `MASTER-PLAN.md` — authoritative Phase 0–10 roadmap and status.
- `PROJECT-STATUS.md` — current stage checkpoint and continuation instructions.
- `ARCHITECTURE.md` — system structure, boundaries, and technology baseline.
- `DATABASE.md` — relational model and migration policy.
- `ROUTES.md` — current and planned application routes.
- `API.md` — server boundary and endpoint conventions.
- `SECURITY.md` — security model and review requirements.
- `PAYMENTS.md` — payment architecture and verification rules.
- `TESTING.md` — verified commands, test layers, and stage gates.
- `CHANGELOG.md` — meaningful stage-level changes.
- `phases/` — scope, tests, acceptance criteria, and sign-off for each phase.
- `decisions/` — durable architecture decisions and their trade-offs.

## Status Markers

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

Documentation updates are part of stage completion. A stage is incomplete until implementation, verification, documentation, and status updates are all complete.
