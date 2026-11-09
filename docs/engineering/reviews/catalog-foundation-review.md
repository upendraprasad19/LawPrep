# Initial catalogue database foundation: review and application boundary

27 October 2026. Development target: `lawprep-dev` (`gacxelyzqoftocfmlisy`), using the owner's Law Prep connection. **Applied after the owner's explicit ok to the reviewed initial migration and temporary database tests.**

## What this batch would change

Create empty catalogue metadata tables; private draft/source/content-version/answer-key/review/audit tables; a private editorial-files bucket; explicit read policies and limited publisher-membership helper; immutable historical identity and review/graph guards. Create no real publisher, content, payment integration or learner history. No existing tables/data are dropped. Public roles cannot directly write any catalogue/private relation. Publication RPCs, application Auth/services/UI and owner bootstrap remain later Task 3 work.

The local config uses Postgres 17, exposes public schemas only, requires explicit grants and disables automatic seeding. Local config does not change hosted API settings by itself. Actual target settings/grants/policies must be checked before and after an authorized migration.

## Actual independent review

Reviewer `/root/checklist_review` accepted the high-risk preparation plan, then performed static SQL/config/test and gate-extension review. Original findings: reviewed versions still permitted additional child inserts; mutable cycle/topic metadata and prerequisite relationships could change historical meaning; locking alone did not protect callers using repeatable snapshots. The reviewed correction seals bindings under parent locks, freezes identity while allowing availability changes, rejects cyclic/sealed graph insertions and explicitly requires READ COMMITTED for both locking protocols.

Final verdict: **accepted for scoped static review of the proposed initial development migration and fingerprint extension, no remaining Critical or Important findings.** No runtime or whole-Task-3 acceptance follows.

Reviewed files and SHA256:

| File | SHA256 |
| --- | --- |
| `supabase/migrations/20261027151914_catalog_foundation.sql` | `1FBC327B778C4FA5900103125346840EE5C76D561B1656CA160FF14E3B74286B` |
| `supabase/tests/database/catalog.test.sql` | `86FBC623DEC6465317EB498145130D469F1276DF75028358E95EBED53E79F43F` |
| `supabase/tests/database/catalog-isolation.test.sql` | `5214BEDCE3638DF35440643A8AEC0A44C775536F4913DD23C7783E52A868C8AA` |
| `supabase/config.toml` | `A99B5192738E3BAF478456C263AFBAEBA4CC3B95A3986583D8115CD8BA05242E` |

Reviewed full-source fingerprint: `9f9d59014c24bc87d4af0f7176420d762566d632cd8a6fa682dfd3ca829f3e72`. Historical foundation.json is deliberately not rebound to this partial static review.

## Pre-application checks (historical)

- Read-only hosted preflight confirmed Postgres 17.11, missing target relations and no pgTAP installation. No hosted changes were made.
- CLI 2.122.0 help/version verified; init and migration generation performed locally, retaining generated filename. The newer CLI uses its declared JavaScript shim; an older cached executable was not used to generate this migration.
- Fingerprint regression failed before the fix when a new migration did not change the hash. After adding Supabase source roots and exact scratch exclusions, all 19 process tests passed with zero failures/cancellations/skips/TODOs. Focused ESLint and JavaScript syntax checks passed.
- Local database test attempt failed with connection refused at 127.0.0.1:54322. SQL/pgTAP are **BLOCKED/unrun**, not passed or observed RED/GREEN. Schema privileges, real Auth/HTTP/Storage, clean replay/type generation and multi-connection behavior still need actual execution.
- Reviewer read the stored process logs, confirmed exact hashes and source guards, and made no repository/cloud mutations. Static inspection is weaker than runtime verification.

## Application and real database verification

Supabase confirmed successful application and migration history version `20261027154900`, name `catalog_foundation`. The Management tool assigned this version at application time. The local SQL file was renamed from the CLI preparation version to `supabase/migrations/20261027154900_catalog_foundation.sql` to match actual hosted history; contents retain the exact reviewed SHA256 above. No remote migration history was edited. The original preparation filename in the static-review table is historical provenance.

Post-application inspection found all twelve project tables empty and RLS-enabled, and the editorial bucket private. No publisher was enrolled and no real content published. Public schema types were generated from the actual development project into `packages/server/src/database.types.ts`; private editorial schema generation remains separate. Compiler checks passed.

Actual hosted pgTAP checks: **49/49 catalogue/schema/role assertions and 2/2 repeatable-isolation rejection assertions passed.** The connector returns only the final SQL result, so an ignored transport adapter executes the original test body inside a DO subtransaction, replacing top-level SELECT assertions with PERFORM. `finish(true)` rejects any failing assertion, and the expected executed plan count is also checked. A caught sentinel exception rolls back extension installation, synthetic records and role changes before returning transaction-local JSON. The isolation suite executes under REPEATABLE READ. This is actual Postgres role testing, not real Auth-token or HTTP proof.

The adapter's deliberate failing-assertion control correctly returned `passed:false`, `P0001: 1 test failed of 50`; it cannot turn that failed assertion into success. Independent cleanup queries verified zero rows in all twelve project tables, no fixture Auth users and no pgTAP installation. Adapter SQL and observed evidence are in the ignored plan workspace (`catalog-hosted-*.sql`, `catalog-hosted-evidence.json`).

Security advisor triage: eight INFO notices about private RLS tables without policies match intentional default-deny plus revoked relation grants. Two WARN notices concern the provider-created `public.rls_auto_enable()` definer function, outside our migration: PUBLIC/anon/authenticated have EXECUTE. A direct anonymous SQL probe returned without error, so this advisory is not dismissed as a false positive. The provider function has not been changed; narrow hardening requires review and appropriate authorization before production readiness. [Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

Performance advisor INFO notices identify two composite foreign-key index shapes and unused indexes on empty tables. `catalog_entries` has a unique primary-key index on `version_id`, bounding its version lookup to at most one row. `version_topics` instead has primary key `(version_id, topic_id)`: its leftmost `version_id` can support that filter, but one version can have many topic rows and there is no one-row bound. Realistic query-plan/volume evidence remains pending; do not dismiss the advisor or add wide indexes/drop fresh indexes without that review. [Foreign-key advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

Remaining proof: clean migration replay, private generated-type drift, multi-connection races, real Auth/HTTP/Storage bytes, publication services/UI and current whole-task review. Task 3 is incomplete; foundation.json remains historical. No production-readiness claim follows from the 51 database assertions.

Post-application independent review: `/root/checklist_review` accepted the initial foundation/evidence/generated-public-types scope at fingerprint `8f969d0174524748e520e2daddc14824f989117c603e59e238b58c2b27164d7b`, no remaining required fixes in this batch. It compared both adapter bodies with every canonical test line, checked the single deliberate negative-control difference, reviewed migration-byte identity/generated types, and verified the corrected status/index documentation. It inspected stored evidence without replaying writes or independently querying cloud state. The provider-default permission warning and remaining whole-task/runtime/release proof are outside this scoped acceptance.

## Authorization and repair boundary

The owner approved this initial hosted migration and synthetic transactional tests; do not ask again for that completed action. Further hosted schema/policy changes still need the applicable explicit instruction under AGENTS.md. Tests are distinct from real sign-in/Storage/concurrent-connection tests. If any assertion fails, stop acceptance, diagnose and repair through reviewed changes. No real imported item is published.

Apply only via an atomic migration operation. An application error must roll back the batch; verify migration history/schema afterwards rather than assuming success. After successful application, changes are forward-versioned; do not reset/drop hosted data as an automatic rollback. A later destructive repair needs its own backup and authorization. No commit, push, deployment, native build or paid provisioning is part of this permission.
