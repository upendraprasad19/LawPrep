# Engineering discipline

Accepted 24 October 2026. Execution method: primary agent, independent reviews at critical milestones and completion.

The [coding checklist](coding-checklist.md), researched and consolidated 27 October, is the daily entry point for all contributors and assistants. Use its [change-evidence template](change-evidence-template.md) in the current ledger/review note. It separates installed automation, manual evidence and pending release controls; adding a rule is not proof that it is enforced.

Work in small testable changes. Run compiler/linter before reviewers inspect code. Fix regressions; do not hide them by suppressing checks. Use standard tooling before custom detection.

Risk: copy/style is low; ordinary learner behavior is normal; authentication, permissions, schema, scoring, deadlines, content publication, subscriptions, AI data/quota and release tooling are high. High risk requires an independent plan review before implementation and an independent code/domain/security review after. Review records identify scope, actual reviewer, findings and source fingerprint. Material edits invalidate affected acceptance.

`npm run verify` calls the same gate registry locally and in CI. Required registration/activation changes are high-risk policy changes. Gate results are PASS, FAIL, BLOCKED or NOT_APPLICABLE. Future checks are not evidence of implemented behavior; unavailable active checks block acceptance. No active required check can be skipped or downgraded through caller context.

Known-bad gate fixtures and semantic behavior tests defend our own tooling. Tests never use production data; two-account isolation and concurrency need real Postgres/Supabase verification, not mocks.

Release readiness has three independent records: software correctness/security/accessibility; reviewed exam content/coverage/disputes; and operations/backups/restore/monitoring/costs. Review of a document is not proof of any of these behaviors. Hosted required checks, branch protection and release promotion remain unconfigured until an authorized push/configuration stage.

Publication, provisioning, commits, pushes and native builds require explicit owner instructions. A deployment request does not authorize unrelated schema destruction. Preserve the execution ledger while changes remain uncommitted.
