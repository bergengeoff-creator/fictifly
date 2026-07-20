# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fictifly — a creative-writing platform for individual writers and classrooms. Users generate
AI-assisted microfiction/flash fiction/characters, build a public writer profile, and (for
teacher accounts) run classrooms with assignments, rubric-based grading, and student rosters.

Create React App frontend + Vercel serverless functions (`/api`), backed by Supabase (Postgres +
Auth) and the Anthropic API for text generation.

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

Client-side (must be prefixed `REACT_APP_`, baked in at build time):
- `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` — used by `src/supabase.js`
- `REACT_APP_ANTHROPIC_KEY` — used directly by some `/api` functions as a fallback

Server-side only (Vercel functions, never exposed to the client):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

`/api` functions generally resolve config as `process.env.SUPABASE_URL ||
process.env.REACT_APP_SUPABASE_URL` (server-side var first, `REACT_APP_` as fallback). Follow
this pattern in new/edited API files rather than reading only one or the other.

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
- Styling is plain inline `style={{...}}` objects throughout — there is no CSS-in-JS library,
  Tailwind, or CSS modules setup (aside from the untouched CRA `App.css`/`index.css`). Match this
  convention rather than introducing a new styling approach.

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
role key for privileged reads/writes).

`api/generate.js` proxies to the Anthropic Messages API — the frontend never calls Anthropic
directly. Generator pages (`src/pages/generators/*`) call `/api/generate`, then typically call
`/api/update-streak` and `/api/check-badges` as follow-up side effects.

**Known issue**: `api/feedback-endpoints.js` imports `../supabase` (a file that does not exist at
the repo root — `src/supabase.js` is the only one) and is not referenced anywhere in `src/`. It
appears to be superseded by the feedback/rubric actions now living in `api/teacher-features.js`.
Don't extend it; if touching feedback/grading endpoints, look in `api/teacher-features.js` first.

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
