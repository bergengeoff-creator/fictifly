# Barceloneta — Design System

The palette and type rules for Fictifly. `src/styles/theme.css` enforces this;
this file explains it.

**If you're adding a colour, it must already be in the palette below.** If it
isn't, that's a decision — make it deliberately, add it here, and log it in
`DECISIONS.md`. Colours have entered this system by accident twice.

---

## Palette

Every ramp has a light, base, and dark step. This matters more than it looks:
**the dark steps are for text on light grounds, the light steps for text on
dark grounds.** That's what makes a dark theme a repointing job rather than a
second palette.

### Ink — text and neutrals
| Token | Hex | Use |
|---|---|---|
| `ink` | `#3A3226` | Primary text |
| `ink-mid` | `#6B5D4E` | Secondary text |
| `ink-light` | `#9A8878` | Decorative only on light — see Contrast |
| `ink-faint` | `#7E6B59` | Tertiary text on light (added Aug 2026) |

### Sand — surfaces
| Token | Hex | Use |
|---|---|---|
| `white` | `#FFFCF8` | Raised surface / cards |
| `sand` | `#F5EFE6` | Page ground |
| `sand-mid` | `#EDE3D4` | Recessed surface, chips |
| `sand-deep` | `#D9C9B0` | Borders |
| `ground` | `#1A1610` | Dark ground (student flow, dark theme) |

### Terra — secondary action, warmth
| Token | Hex | Use |
|---|---|---|
| `terra-light` | `#E8A882` | Dark-theme text |
| `terra` | `#D4845A` | Fills, borders, accents |
| `terra-dark` | `#B56840` | Hover states — *not* text, see Contrast |
| `terra-text` | `#A85535` | Terra as text on light (added Aug 2026) |

### Sea — primary action
| Token | Hex | Use |
|---|---|---|
| `sea-light` | `#A8D4F0` | Dark-theme text |
| `sea-mid` | `#5B9EC9` | Borders, icons, dark-theme accent |
| `sea` | `#2E6DA4` | Primary buttons, links on light |

### Gold / Brass — status, ornament
| Token | Hex | Use |
|---|---|---|
| `gold-light` | `#E8C888` | Dark-theme text |
| `gold` | `#C8A060` | Warning borders, ornament |
| `gold-dark` | `#8A6030` | Warning text on light |
| `brass-light` | `#D8B060` | |
| `brass` | `#B8903A` | The Well artwork |
| `brass-dark` | `#7A5A18` | |

---

## Contrast

WCAG AA requires 4.5:1 for body text. Measured on `white` (#FFFCF8):

**Legal as text on light ground:** `ink` 12.34 · `ink-mid` 6.22 ·
`brass-dark` 6.22 · `gold-dark` 5.41 · `sea` 5.35 · `ink-faint` 4.97 ·
`terra-text` 4.9

**Not legal as text on light ground:** `terra-dark` 4.09 · `ink-light` 3.33 ·
`brass` 2.90 · `sea-mid` 2.86 · `terra` 2.83 · `gold` 2.37 ·
`terra-light` 1.98 · `gold-light` 1.57 · `sea-light` 1.54

Those aren't broken colours — they're fills, borders, and dark-theme text.
They just can't carry words on parchment.

**On `ground` (#1A1610) the ranking inverts:** `sea-light` 11.44 ·
`gold-light` 11.19 · `terra-light` 8.88 · `gold` 7.42 · `terra` 6.21 ·
`sea-mid` 6.16 · `ink-light` 5.29 — while `sea` drops to 3.29 and fails.

This is why accents must be role tokens. `--accent` is `sea` on light and
`sea-mid` on dark; using a fixed brand colour breaks one theme or the other.

**Why this matters commercially:** school districts increasingly ask about
WCAG AA in procurement. Failing contrast on stat labels and assignment
metadata is a question you don't want asked mid-pitch.

---

## Type

- **Fraunces** — content, headings, character sheets, anything a writer reads
  as writing. Variable axes: `SOFT` and `WONK` are in use on display text.
- **DM Sans** — all UI. Buttons, labels, navigation, metadata.

Both must be loaded in `public/index.html`. `theme.css` sets them on `body`.

> ⚠️ `Dashboard.jsx` currently sets `fontFamily: 'sans-serif'` on its root
> div, overriding DM Sans for everything beneath it. Remove it.

### Recurring patterns
- **Eyebrow:** 0.68rem, weight 600, letter-spacing 0.15em, uppercase, in an
  accent colour. Used above headings throughout.
- **Card:** `white` background, 1px `sand-deep` border, 14px radius,
  `0 2px 12px rgba(58,50,38,0.05)` shadow, often a 4px coloured left border.
- **Chip:** 20px radius, 0.82rem, tinted background.

---

## Drift log

Colours that entered the system without a decision. Recorded so the same
mistake is recognisable next time.

| Colour | Where | Status |
|---|---|---|
| Green | "Shape the future" panel | **Removed** (~May 2026) — replaced with sea |
| Violet `#7A4A90` / `#B07AC0` / `#F5EDF5` | Character-day card, `Dashboard.jsx` | **Open** — no violet in Barceloneta. Suggested remap to gold, which suits the ✦ mark. Decide and log it. |
| `#9A6830` | Trial-warning banner | **Open** — two digits off `gold-dark` `#8A6030`. Eyeballed, not chosen. |

The pattern in all three: a colour was needed, none was to hand, one got
invented inline. The token layer is the fix — if a role is missing, add it to
`theme.css` rather than reaching for a hex.

---

## Assets

- **The Well** — `src/components/TheWell.jsx` and `src/utils/TheWell.jsx`
  **must stay identical.** Divergence has broken the Vercel build.
  A third hand-inlined copy currently sits in `Dashboard.jsx`; it should
  import the component instead.
- **Logo** — `fictifly_logo.svg`. Wordmark ink is `#3A3226`, invisible on dark
  grounds. Needs a reversed variant, or remap the fill via a token.
- **Icons** — 52×24, stroke-only, in `sea-mid` or `terra`. No emoji in UI.

---

## Themes

Light is the default and the ground truth. Dark exists in `theme.css` as a
commented `[data-theme="dark"]` block, not yet wired up.

Open question before it ships: the student flow is *already* dark by design,
as a deliberate signal of a separate space. A global toggle would erase that
distinction. Decide whether students get the toggle at all.