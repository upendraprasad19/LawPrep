# Law Prep working rules

The owner's global rules apply. Implement the approved product design and 24 October engineering baseline.

- No commit, push, public deployment, cloud project creation, live migrations/payments or native builds without a separate explicit instruction.
- Use this isolated managed worktree. Preserve original prototype, PDFs and research; imported content stays draft until editorial review and source/rights checks.
- Read the [coding checklist](docs/engineering/coding-checklist.md), [discipline](docs/engineering/discipline.md), [contracts](docs/engineering/contracts.json), [threat model](docs/engineering/threat-model.md) and the current task brief before changes. Record applicable checklist IDs/results using the linked change-evidence template in the existing task ledger or review note; do not claim manual rules are automatically enforced.
- Browser code consumes typed HTTP contracts; database/provider/privileged operations live in server-only modules. Runtime authorization, not submitted identity or a TypeScript actor object, grants access.
- Canonical writers and projections own scoring, timing, access and progress meaning. Reading completion, assistance, understanding and retention remain separate.
- Meaningful behavior gets a failing test before implementation and relevant real-boundary verification. Never call missing/skipped/zero-test checks passed.
- Run focused checks during development and `npm run verify` before milestone acceptance. Current milestone defines installed checks, not overall production readiness.
- High-risk plan/code changes require independent milestone review; normal product changes get independent code review; final whole-product review remains required. Record actual findings/evidence, never invent approvals.
- User corrections and significant-work memories follow the owner's rules. Keep execution progress and rulings in this plan's ignored ledger; no automatic commits or scratch deletion.
- Do not copy reference-project rules/credentials/data or introduce video, mentorship, native builds, offline replication or live billing into the current scope.
