# Fictifly — Decisions

Append-only. Newest at the top. Never edit or delete an entry — if a decision
is reversed, add a new entry that says so and link back.

The point of this file is **rationale**, not the decision itself. The decision
is usually visible in the code; the reasoning isn't, and that's what gets lost
and re-litigated.

**Format:** date · what · why · what it rules out
Dates marked `~` are approximate, reconstructed from chat history.

---

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