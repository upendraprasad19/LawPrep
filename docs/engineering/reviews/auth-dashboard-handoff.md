# Development Auth dashboard handoff

30 October 2026. Continuation of previously approved development email/callback configuration. This records observed settings; it is not a new whole-source or production acceptance.

- Signed-in dashboard verified as `lawprep-dev`, ref `gacxelyzqoftocfmlisy`.
- Magic link/OTP template editor is disabled without custom SMTP or Pro. Existing subject `Your sign-in link` and default confirmation-link body remain unchanged. No attempt to bypass the restriction, provision SMTP or upgrade.
- Site URL changed from default `http://localhost:3000` to `http://127.0.0.1:43173/study/`. Saved redirect list contains exactly that URL, no wildcard. Dashboard success state and saved values verified; screenshot `output/auth-activation/callback-settings.jpg`.
- Existing server start script binds this exact loopback origin; started successfully and account screen opened. Existing SDK uses PKCE and `/study/` emailRedirectTo. The code screen already explains that an emailed link must be opened in the same browser. No implementation or dependency changes.
- Read-only database check found zero matching owner identities, confirmed identities and live sessions. Dashboard login does not create an application identity. No agent-triggered email, Auth user or owner membership.
- C01/C07 and G06: callback settings verified for local development; actual delivery, authenticated boundaries and owner enrolment still pending. All other pending release requirements retain their owning tasks. Historical test results were not rerun or represented as fresh email acceptance.

Owner handoff: click Send sign-in code in the local account page, then open the actual emailed link in the same in-app browser. Do not share codes, links or tokens in chat. Existing authorization covers conditional owner enrolment once its confirmed-identity/live-session preconditions are met. Default delivery is limited to organization team addresses and rate limited; custom SMTP must be selected/configured before inviting students. See the [official SMTP limits](https://supabase.com/docs/guides/auth/auth-smtp).
