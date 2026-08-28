# Fictifly — Decisions

Append-only. Newest at the top. Never edit or delete an entry — if a decision
is reversed, add a new entry that says so and link back.

The point of this file is **rationale**, not the decision itself. The decision
is usually visible in the code; the reasoning isn't, and that's what gets lost
and re-litigated.

**Format:** date · what · why · what it rules out
Dates marked `~` are approximate, reconstructed from chat history.

---

## 2026-08-28 · Landing page live at fictifly.com

Static single page in a separate repo (`bergengeoff-creator/fictifly-site`),
served by GitHub Pages. DNS at Cloudflare: four A records on `@` to GitHub's
Pages IPs plus a `www` CNAME, all **DNS only (grey cloud)** — proxying breaks
GitHub's domain validation and certificate issuance. Cloudflare SSL/TLS mode
must be Full (strict); Flexible causes a redirect loop.

Teacher-first: the pilot audience is educators, so the page leads with roster
setup, assigning, grading, and the minors-safety posture. Writers get a
masthead link and a footer band. Signups carry a `role` field (`teacher` |
`writer`) that maps onto `account_type` when signup moves into the app.

---

## 2026-08-28 · Publishable keys do not resolve to the `anon` Postgres role

Cost several hours. An RLS policy scoped `to anon` never applies when the
request authenticates with a publishable key (`sb_publishable_*`) — every
insert fails with 42501. Policies for public client access must be `to public`,
with the real gatekeeping in the `with_check` expression.

Two related traps found alongside it:
- Requests need **both** `apikey` and `Authorization: Bearer` headers. Sending
  only `apikey` returns 401 with a misleading "Invalid API key".
- Do **not** send `Prefer: resolution=ignore-duplicates` without an
  `on_conflict` parameter — PostgREST rejects the request. The unique index
  still prevents duplicates; a repeat returns 409, treated as success.

Checked and confirmed: no policy in the app's schema is scoped `to anon`, so
the app is unaffected. Verify with:
  select tablename, policyname from pg_policies
  where schemaname='public' and 'anon' = any(roles);

---

## 2026-08-28 · Waitlist stores in Supabase, not a mailing-list service

Signups POST to a `waitlist` table (email, role, source, created_at) with an
insert-only RLS policy and no select policy, so the publishable key is safe in
public page source — it can add a row but cannot read the list back.

Chosen over Kit because Supabase is already in the stack: entries sit alongside
the eventual `users` rows, so converting a signup into an account is a query
rather than an export.

Known gap: Supabase stores but doesn't send. A mailing tool will be needed
before emailing the list at any scale.

Supersedes the earlier Kit decision. Mailchimp remains ruled out.

---

## 2026-08-28 · One-liner generator flagged in-app, not on the landing page

A fourth generator producing a single-sentence prompt — a classroom bell-ringer.
Not built. Shown in the app's generator list as "coming soon" rather than
advertised on the marketing page, so the expectation is set with people already
inside rather than with prospects.

Blocker to settle first: `saved_prompts` is ingredient-shaped with no free-text
column. A one-liner needs a new column or a deliberate mapping — same mismatch
class that broke `CreateAssignmentForm`.

---

## 2026-08-23 · Waitlist stores in Supabase, not a mailing-list service

Landing-page signups POST to a `waitlist` table (email, role, source,
created_at) with an insert-only RLS policy and no select policy — so the anon
key can ship in public static source without exposing the list. Setup lives in
`waitlist-setup.sql` in the landing-page repo.

Chosen over Kit because it's already in the stack: entries sit alongside the
eventual `users` rows, so converting a signup into an account is a query rather
than an export. No third-party account, no free-tier ceiling, no data held
elsewhere.

Known gap: Supabase stores but doesn't send. A mailing tool will be needed
before emailing the list at any scale — seed it from the table then.

Supersedes the earlier Kit decision (2026-08). Mailchimp remains ruled out.

---

## 2026-08-23 · Landing page is teacher-first, with a writer escape hatch

The near-term goal is a teacher pilot, so the page leads with the classroom
case: roster setup, assigning, grading, and the minors-safety posture. Writers
get a masthead link and a footer band rather than equal billing.

Signups carry a `role` field (`teacher` | `writer`), set by a toggle on the
form and preselected by the writer links. The two audiences stay separable from
the first signup, and the field maps onto `account_type` when signup moves into
the app.

Revisit when the writer side becomes the priority.

---

## 2026-08-23 · One-liner generator: flagged in-app, not on the landing page

A fourth generator producing a single-sentence prompt — a bell-ringer for
classroom warm-ups. Not built. Advertising it on the landing page would create
an expectation before a pilot; showing it in the app's generator list as
"coming soon" sets the same expectation with people who are already inside.

Blocker to be settled first: `saved_prompts` is ingredient-shaped and has no
free-text column, so a one-liner needs either a new column or a deliberate
mapping. Same mismatch class that broke `CreateAssignmentForm`. Decide the
schema before building.

---

## 2026-08-23 · Saved-prompt picker reads `saved_prompts` client-side

`CreateAssignmentForm.jsx` called `/api/teacher-features?action=getPrompts` —
an action that was never implemented — and expected `title` / `content` fields
that don't exist on `saved_prompts`. The table is ingredient-shaped: `genre`,
`prompt_type`, `word_count`, `action`, `word`, `location`, `object`. Two gaps,
not one: a missing endpoint *and* a data model that never existed. A catch
block swallowed the failure, so teachers saw an empty dropdown rather than an
error.

Fixed by querying `saved_prompts` directly with the user's own session, the way
`AssignModal.jsx` and `Dashboard.jsx` already do — RLS scopes reads to the
owner, so no server endpoint is needed. Labels and preview now compose from the
ingredient fields, following `AssignModal.jsx`'s `{genre} · {word_count}w`
convention. Both failure modes now surface through the form's existing error
banner.

Side effect: `assignments.prompt_title` / `prompt_content` are now neither
written nor read anywhere. Dead columns, safe to drop.

Rules out: a `getPrompts` API action, and any assumption that `saved_prompts`
rows carry a title or body.

---

## 2026-08-23 · Two assignment-creation paths, both kept

`CreateAssignmentForm.jsx` (classroom side, "+ New Assignment") and
`AssignModal.jsx` (generator side, "Assign" on a prompt card) are both live and
teacher-gated. They look like duplicates but serve different intents: planning
an assignment from scratch versus sending a prompt you're already looking at.

Recorded so this isn't mistaken for drift later.

---

## 2026-08-23 · Teacher pilot before legal work

Early testing will be a handful of selected educators evaluating the teacher
experience — no real students, so no student data, so the COPPA/FERPA questions
largely don't attach at this stage. Product work moves ahead of the counsel
session.

Still required before any real classroom use: a scoped consult on the pilot
itself, then the fuller privacy/compliance session.

## 2026-08 · Removed `api/feedback-endpoints.js`

~550 lines implementing a parallel feedback/comment/reply API. Never wired up —
imported a nonexistent `../supabase` path and was referenced nowhere. Superseded
by the action-routed endpoints in `api/teacher-features.js`.

Recoverable from git if the reply-threading shapes are ever wanted.

Rules out: a second feedback API surface. Extend `teacher-features.js` instead.

## 2026-08 · Documentation lives in the repo, not in chat

Chat sessions can't be reliably searched across, and each new session starts
without context — leading to duplicated work and invented values that already
existed. `docs/` becomes the source of truth; sessions open by reading it.

Rules out: relying on conversation history as a project record.

---

## 2026-08 · Marketing site on GitHub Pages, not Squarespace

No recurring cost before there's anything to justify it. Static single page,
no build step. Revisit if the site needs to become more than one page.

Rules out: paying for hosting pre-validation.

---

## 2026-08 · Kit for the waitlist, not Mailchimp

Mailchimp's free tier was cut to 250 contacts / 500 sends (Feb 2026), with
automation removed entirely. Kit's free plan holds 10,000 subscribers with
unlimited sends. Known ceiling: one automation, and paid starts at $39/mo with
no intermediate tier.

Rules out: Mailchimp. Revisit if the single-automation limit binds.

---

## 2026-08 · Semantic token layer over the Barceloneta palette

Palette values were inline literals throughout the app, with no enforcement —
allowing near-miss hexes (#9A6830 vs gold-dark #8A6030) and off-palette colours
to enter unnoticed. `theme.css` adds a role layer (`--text`, `--surface`,
`--accent`) that components reference instead.

Also makes dark mode tractable: the palette already contains both ends of each
ramp, so a theme switch repoints roles rather than inventing colour.

Rules out: new components using raw hex values.

---

## 2026-08 · Inline styles stay; no Tailwind or CSS-modules migration

Inline styles referencing CSS variables theme correctly and require no
structural change. A styling-layer rewrite is high-risk for low return.

Rules out: framework migration as a prerequisite for theming.

---

## ~2026-07 · `teacher_plus` class limit is 5, not 10

Initially built as 10; reduced. Limits live in `CLASS_LIMIT_BY_TIER` /
`STUDENT_LIMIT_BY_TIER` in `src/utils/accountTiers.js`.

---

## ~2026-07 · `accountTiers.js` is the only place roles are checked

A codebase grep found 22 literal `account_type === 'teacher'` comparisons
across 10 files — each one silently excluded `teacher_plus`, and some excluded
`minor`. Centralised into `isTeacherRole()`, `isPremiumWriter()`,
`isStudentRole()`.

Rules out: comparing `account_type` to a string literal anywhere.

⚠️ Verify: `CLAUDE.md` places `CLASS_LIMIT_BY_TIER` / `STUDENT_LIMIT_BY_TIER` in
`ClassroomDashboard.jsx`, not `accountTiers.js`. If both define them, that's a
duplicate source of truth — the exact bug class this entry was meant to close.

---

## ~2026-07 · `feedback_retention_settings` dropped

Never wired up, and modelled on days-since-submission rather than the
calendar-date model actually needed. Replaced by `classes.term_end_date`
driving `retention_date`. Retired design captured in
`retired-feedback_retention_settings.md`.

---

## ~2026-07 · Reply limits are not tier-gated

Teachers always unlimited. Deliberate: rate-limiting teacher feedback would
undercut the core classroom value.

---

## ~2026-07 · School-tier retention extension deferred

Will be an additive `classes.retention_extension_days` layer when needed.
Not built now.

---

## ~2026-05 · Character generator ships at beta launch, not held back

It's feature-complete (genre selection, era/setting chips, locked fields,
non-human characters, badge integration, save). Two generators alone is thin
for a paid product, and character days in the daily challenge create natural
discovery.

Open question at the time: whether free users get limited generations or a
teaser. Suggested limited generations, matching the other generators.

---

## ~2026-05 · The Well built in-house, not commissioned

Programmatic SVG primitives read as mechanical. Artwork produced directly in
vector tools instead, with CSS animation layered on the clean export.

---

## ~2026-05 · Green is off-brand

Corrected explicitly. The "shape the future" panel uses sea blue. Barceloneta
contains no green.

(See also: violet, flagged 2026-08, in `DESIGN.md`.)

---

## ~2026-05 · The Well icon sits beside the welcome heading

Moved from beside "Start writing." It's a brand arrival moment, not a
functional prompt.

---

## ~2026-05 · Teens join by class code only during beta

No open self-registration for 13–17. Under-13 routes to the teacher pathway.
Parent waitlist with guardian confirmation. Reduces the compliance surface
during beta.

---

## ~2026-05 · Privacy architecture: minimise rather than protect

Derived date field instead of birthdate; synthetic emails for student
accounts; system-generated usernames for minors; adult and minor content
never share a feed.

Principle: data not collected can't be breached, subpoenaed, or mishandled.
Pending counsel confirmation that client-side age verification is sufficient.