# CLAT sample learning task board

Scope is one complete sample session from CLAT setup through a lesson, worked example, practice feedback and a suggested next step. Work follows the approved Task 7 plan in the existing worktree.

| ID | Task | Status | Completion check |
| --- | --- | --- | --- |
| SL01 | Plan and review the sample boundary | Complete | Independent plan review accepted caller ownership, versioned grading and draft separation. |
| SL02 | Connect onboarding and diagnostic to the lesson | Complete locally | Built-browser checks cover the setup continuation and the link from diagnostic feedback. |
| SL03 | Teach and practise | Complete locally | The original lesson includes an objective, worked example and two questions. Isolated database checks verified grading and protected answer keys. |
| SL04 | Save activity and resume | Complete locally | Database checks verified idempotent retries and distinct repeat attempts. The browser checked recovery after a lost response and restoration after reload using fixture data. |
| SL05 | Verify and prepare handoff | Complete locally | Ten iteration gates passed. The final rebuild passed 20 browser tests. Independent code review accepted the scoped implementation after two fixes. |

The sample uses original material with a fixed version and its own activity records. The access, setup and sample migrations are applied to `lawprep-dev`. A temporary learner verified preferences, grading, identical retry and resume across two real Auth sessions through the local app API. The test account and activity were removed. Hosted verification found that conflicting saves time out because the database gateway retries the conflict. The corrective migration is pending. The wider planner, notes, revision and mock flows remain separate completion items.
