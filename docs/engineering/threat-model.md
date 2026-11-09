# Initial threat model

Status: design baseline; controls require implementation and evidence.

| Boundary / assets | Misuse | Required protection | Tasks |
| --- | --- | --- | --- |
| Anonymous -> API | Read drafts/paid lessons/keys or forge identity | Explicit route policy, input limits, no private payloads, verified sessions | 1,3–5 |
| Student A -> student B | Guess IDs; stale cache/late response exposes another account | RLS plus API ownership; full identity cache scope; session-generation guard | 4,7–9,13 |
| Client -> assessment | Extend clock, forge score, double-submit or overwrite new answer | Server deadline/key snapshots, transactions, unique mutation IDs, revisions | 8 |
| Publisher -> content | Unreviewed/unsafe content becomes authoritative | Restricted runtime role, safe rendering, source/rights checks, immutable versions | 2–3,11 |
| Merchant -> access | Forged/replayed/out-of-order event grants access | Raw signature verification, immutable server bindings, idempotent transactions | 12 |
| Student/retrieved text -> model | Prompt injection leaks keys/data or executes writes | Minimal authorized context; no active-assessment help; constrained validated output | 13–14 |
| Concurrent model requests -> quota | More successful charged requests than allowance | Atomic reservations, bounded leases, idempotent completion/recovery | 13 |
| CI/deployment -> production | Untrusted code gains secrets; push deploys unexpectedly | Least privilege, isolated test DB, pinned actions, explicit promotion | 0,16 |

Secrets belong only in server secret stores. Logs redact tokens, payment payloads and student conversations. Data deletion/retention/export, recovery, restore tests, operational contacts and commercial hosting eligibility must be verified before production reliance. No availability promise follows from a free-tier account.
