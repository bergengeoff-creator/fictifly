# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fictifly — a creative-writing platform for individual writers and classrooms. Users generate
AI-assisted microfiction/flash fiction/characters, build a public writer profile, and (for
teacher accounts) run classrooms with assignments, rubric-based grading, and student rosters.

Create React App frontend + Vercel serverless functions (`/api`), backed by Supabase (Postgres +
Auth) and the Anthropic API for text generation.

## Before starting work

Read `docs/STATUS.md` — current state, open bugs, priorities.
Decisions and their rationale: `docs/DECISIONS.md`.
Design system: `docs/DESIGN.md`.

## Commands

```
npm start          # dev server, http://localhost:3000 (CRA)
npm run build       # production build to /build
npm test             # CRA/Jest watch mode
npm test -- --watchAll=false --testPathPattern=App   # run a single test file, non-interactive
```

There is no separate lint or typecheck script; ESLint runs via `react-app`/`react-app/jest`
config embedded in CRA's build/start/test. There is essentially no test suite beyond the CRA
boilerplate `src/App.test.js`.

Vercel functions in `/api` are not run by `npm start` — they only execute when deployed (or via
`vercel dev` if the Vercel CLI is set up locally). This repo is linked to Vercel project
`fictifly-v2` (see `.vercel/`).

## Environment variables

See `.env.example` and `docs/SECURITY.md`. CRA embeds **every** `REACT_APP_*` variable into the
public JS bundle, so only values that are safe for anyone to read may use that prefix.

Client-side (public, baked in at build time):
- `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` — used by `src/supabase.js`. The
  anon/publishable key is public by design and is only safe because RLS is on for every table.

Server-side only (Vercel functions, never exposed to the client):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
  `CRON_SECRET`, optional `ALLOWED_ORIGINS`

`/api` functions read config through `api/_lib/security.js` (`getSupabaseUrl()`,
`getServiceHeaders()`, `getAnthropicKey()`). Only the public Supabase URL/anon key may fall back
to a `REACT_APP_` var; secrets never do.

**Any `/api` function that uses the service-role key must call `requireUser(req, res)` and take
the caller's identity from the token** — never trust a `userId`/`teacherId` in the request body.
Client code calls these endpoints with `authFetch()` (`src/utils/authFetch.js`), which attaches
the Supabase access token. `npm run build` runs `scripts/verify-build.js` afterwards and fails
if the bundle contains source maps or secrets.

## Architecture

### Frontend structure
- `src/App.js` — all routing (react-router v7). Routes are gated with `<ProtectedRoute>`
  (`src/components/ProtectedRoute.jsx`), which redirects unauthenticated users to `/login`.
- `src/context/AuthContext.jsx` — the single source of truth for `user` (Supabase auth user) and
  `profile` (row from the `users` table). Wraps the whole app; `useAuth()` is how every page/
  component reads auth state. It also auto-creates a minimal `users` row for OAuth sign-ins that
  don't already have one (e.g. first-time Google login).
- `src/pages/` — one file per route. `src/components/` — shared UI (modals, builders, etc.)
  used across pages.
- Styling is plain inline `style={{...}}` objects throughout — no CSS-in-JS
  library, Tailwind, or CSS modules. Keep this convention, but reference design
  tokens rather than hex literals: `style={{ color: 'var(--text)' }}`. Tokens are
  defined in `src/styles/theme.css` (imported once in `src/index.js`) and
  documented in `docs/DESIGN.md`. Never inline a raw hex — if the role you need
  doesn't exist, add it to `theme.css`.

### Auth model — two parallel flows
There are two distinct sign-in paths, both backed by Supabase Auth:
1. **Standard/teacher accounts**: real email + password, or Google OAuth
   (`supabase.auth.signInWithOAuth`). Subject to email verification
   (`awaitingVerification` in `AuthContext`).
2. **Student/minor accounts**: username + numeric passcode. There's no real email — a synthetic
   address `<username>@minor.fictifly.com` is used as the Supabase Auth identity
   (`isMinorEmail()` in `AuthContext.jsx` special-cases this domain to skip email verification).
   Passcode reset/recovery for these accounts goes through `api/request-passcode-reset.js`,
   `api/reset-passcode.js`, `api/save-recovery-phrase.js`, and `api/recover-minor-account.js`
   (a 4-word recovery phrase, hashed with SHA-256, is the recovery mechanism when a teacher isn't
   involved).

### Account types / tiers
`users.account_type` drives most feature gating and is one of: `standard`, `teacher`,
`teacher_plus`, `student`, `minor` (plus a separate `is_premium`/`premium_expires_at` trial
flag on top). `teacher_plus` is a higher tier than `teacher` (e.g. higher class/student limits —
see `CLASS_LIMIT_BY_TIER`/`STUDENT_LIMIT_BY_TIER` in `ClassroomDashboard.jsx`), and `student` vs
`minor` distinguishes teacher-created roster accounts from self-registered minors. Role checks
should go through helpers like `isTeacherRole`/`isStudentRole` (imported from
`../utils/accountTiers` in several pages) rather than comparing `account_type` to a single literal
string — comment history in `Dashboard.jsx`, `Profile.jsx`, `ProfileSetup.jsx`, `Onboarding.jsx`,
and `WriterDirectory.jsx` documents several past bugs from strict-equality checks that missed
`teacher_plus`/`minor`.

### `/api` (Vercel serverless functions)
Each file in `api/` is an independent handler (Vercel's file-based routing — no framework, no
`vercel.json`). Two request patterns are used:
- Single-purpose endpoints (`api/generate.js`, `api/update-streak.js`, `api/check-badges.js`,
  `api/award-badge.js`, `api/create-students.js`, `api/daily-prompt.js`, passcode/recovery
  endpoints) — one handler per file.
- Action-routed endpoints (`api/teacher-features.js`) — a single handler dispatches on a
  `?action=` query param to many sub-handlers (comment templates, rubrics, batch grading,
  submissions, notifications). This is the pattern to extend when adding teacher-side features
  rather than creating new top-level files.

Most functions talk to Supabase via raw `fetch` calls to its REST endpoint
(`${supabaseUrl}/rest/v1/...`) using the service-role key, rather than the `@supabase/supabase-js`
client — this bypasses Row Level Security, so these functions are the trust boundary for
privileged operations (grading, badge awards, student account creation, passcode resets).
`api/teacher-features.js` is the exception and uses `createClient` (one client with the anon key
to validate the caller's bearer token via `getUserFromToken()`, one admin client with the service
role key for privileged reads/writes). Feedback, comment, and rubric endpoints all live in
`api/teacher-features.js` — a superseded standalone `api/feedback-endpoints.js` was removed in
Aug 2026 (see `docs/DECISIONS.md`).

`api/generate.js` proxies to the Anthropic Messages API — the frontend never calls Anthropic
directly. Generator pages (`src/pages/generators/*`) call `/api/generate`, then typically call
`/api/update-streak` and `/api/check-badges` as follow-up side effects.

### Grading & rubrics
`RubricBuilder.jsx` / `RubricViewer.jsx` / `RubricShare.jsx` manage rubric CRUD and public
share links (`/rubric-view/:shareId`, `src/pages/RubricViewPage.jsx`). `GradingModal.jsx` +
`InlineCommentLayer.jsx` handle grading a submission against a rubric, with reusable feedback
snippets managed by `CommentTemplateManager.jsx`. `src/utils/RubricPDF.js` exports a rubric to
PDF. All of these talk to `api/teacher-features.js` action endpoints.

### Badges & streaks
`api/check-badges.js` evaluates a user's activity (generator usage, streaks, account
type/premium status) against the `badges` table and awards any newly-earned ones;
`api/award-badge.js` is the manual/teacher-awarded path (`teacher_awarded=true` badges only).
`BadgeShelf.jsx`/`BadgeModal.jsx` render earned badges; `BadgeDiscovery.jsx`/`BadgePage.jsx` are
the public badge browsing pages.
