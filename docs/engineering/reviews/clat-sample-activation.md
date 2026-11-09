# CLAT sample development activation

On 9 November 2026, the owner authorised the three reviewed database updates in `lawprep-dev` and a GitHub feature-branch push. The rollout kept the original migration bytes and reconciled the filenames to the IDs recorded by Supabase.

| Hosted migration | SHA-256 |
| --- | --- |
| `20261109010154_access_grants.sql` | `38e7d4d657e6551a403b452057e7f3641ec8356e741db39d79e3877fbd653a2e` |
| `20261109010158_study_preferences.sql` | `1f2ca8f522a882eb679da3aaff3ca4d27b667aa0fe3ae31e67cb1a8cbdaa9638` |
| `20261109010200_clat_sample_learning.sql` | `b0075e36e57f35a389938ac7c3112a8668e07456575d313229f2cca35533d5b0` |

A temporary learner signed in with Supabase Auth. The local app API returned Explore access, saved 25 minutes with an undecided date, served the sample without the answer keys, recorded reading and graded correct and incorrect choices. An identical retry returned its original receipt, and a fresh sign-in loaded the saved preferences and latest feedback. Anonymous access was denied. Cleanup confirmed the temporary account, sessions and activity were removed. The original account, 1,313 private imports and 11 private lesson versions remain present. The catalogue has zero content entries.

Hosted verification also found that the gateway retries the deterministic `40001` sample conflict. The app returned 503, the direct request timed out and hosted PostgreSQL logged the same conflict repeatedly. The [Supabase troubleshooting note](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b) describes the same retry behavior.

The locally tested `20261109010657_learner_conflict_status.sql` changes only the deliberate conflict codes for sample activity and study preferences to `PT409`. The app recognises both codes. The corrective migration awaits separate hosted authorisation and verification. The original three applied migrations remain byte-identical.

The activated path was exercised through real Auth and the local app API. The built browser suite uses synthetic fixtures. Full release, delivery and operational acceptance are separate.
