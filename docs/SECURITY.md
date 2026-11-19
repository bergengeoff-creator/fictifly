# Security: secrets and client exposure

Last audit: 2026-11-19 (code, git history of `fictifly` and `fictifly-site`, CRA build output).

## Rules

1. **`REACT_APP_*` = public.** CRA embeds these into the JavaScript bundle anyone can download.
   Only `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` may exist.
2. **Secrets live only in Vercel env vars without the prefix:** `SUPABASE_SERVICE_ROLE_KEY`,
   `ANTHROPIC_API_KEY`, `CRON_SECRET`. Read them via `api/_lib/security.js`.
3. **No `.env` files in git**, in any directory. Use `.env.local` locally; `.env.example` documents names.
4. **Every `/api` function using the service-role key authenticates the caller** with
   `requireUser()` and checks ownership (`teacherOwnsClass`, `teacherHasStudent`). Identity comes
   from the token, never from a `userId` in the body. The browser calls them with `authFetch()`.
5. **No wildcard CORS.** The app is same-origin; add origins to `ALLOWED_ORIGINS` only if needed.
6. **No production source maps.** `npm run build` sets `GENERATE_SOURCEMAP=false`, then
   `postbuild` runs `scripts/verify-build.js`, which fails the build (and the Vercel deploy) on
   source maps, credential patterns, values of secret env vars, or secret-looking `REACT_APP_` vars.

## Endpoint access model

| Endpoint | Who may call | Identity source |
|---|---|---|
| `generate` | signed-in users; allow-listed models, capped tokens/input | token |
| `update-streak`, `check-badges` | signed-in user, own record only | token |
| `save-recovery-phrase` | signed-in `minor`, own account only | token |
| `create-students` | teacher who owns the class; tier student limit enforced | token |
| `reset-passcode` | teacher with the student in one of their classes | token |
| `award-badge` | teacher with the student in one of their classes | token |
| `teacher-features` | per action, via `getUserFromToken()` (`getRubricByShare` is public) | token |
| `daily-prompt` | public (fixed server-side prompt, cached per day) | n/a |
| `request-passcode-reset` | public (by username; creates a pending request) | n/a |
| `recover-minor-account` | public (username + recovery phrase) | phrase |
| `cron-retention-cleanup` | Vercel Cron only | `CRON_SECRET` |

## Open items (not fixable in code alone)

- **Rate limiting** on `recover-minor-account`, `request-passcode-reset` and `generate`
  (e.g. Vercel Firewall rules or an Upstash limiter). Recovery phrases are unsalted SHA-256.
- **Server-side generation quota.** The free-tier daily limit is enforced in the browser only.
- **RLS review** in Supabase. The anon key is public, so RLS is the only thing protecting
  tables the browser touches directly: `users` (client inserts set `account_type`, which
  must not allow self-assigning `teacher_plus`/premium; `recovery_phrase_hash` must not be
  readable), `class_members`, `classes`, `passcode_reset_requests` (stores `new_passcode` in
  plain text after a teacher approves a reset).
- **Git history** still contains the revoked Anthropic key (commits `96a4888`, `e31877e`).
  It is dead, so rewriting history is optional.
