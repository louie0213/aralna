# Motion + responsive progress

## Global timing — 2026-11-06

- Slowed shared motion tokens ~35% so entrances/staggers feel calmer (not sluggish).
- JS: `client/src/lib/motion.js` durations, staggers, and spring stiffness.
- CSS: `client/src/motion.css` duration/stagger variables; route enter in `styles.css`; shell sidebar in `AdminLayout.css`.

## Logo (light/dark references) — 2026-11-06

- Shared `Logo` matches `aralNa/references/light.jpg` + `dark.jpg`: theme swaps badge + **Aral** color; yellow **Na** chip stays.
- Hover: badge tilt/scale, sparkle twinkle, Aral color shift, Na chip lift.
- Wired into landing, auth, admin + student sidebars (replaced BrandMark/BrandWordmark).
- Files: `Logo.jsx`, `Logo.css`, `Landing.jsx`, `AuthLayout.jsx`, `AdminLayout.jsx`, `StudentLayout.jsx`, `AdminLayout.css`.

## Admin Users + Files motion — 2026-11-06

- Users and Files had no Motion wrappers (static vs Overview).
- Added staged `Reveal` entrances (heading → toolbar/table → footer bits). Skipped per-row `tr` stagger so desktop table layout stays intact.
- Files: `client/src/pages/admin/Users.jsx`, `client/src/pages/admin/Files.jsx`.

## Auth (Login / Register) — 2026-11-06

### Layout
- Fixed horizontal overflow from late `.auth { grid-template-columns: minmax(400px, …) }` overriding the mobile stack between **701–900px** (includes tablet **768**).
- Desktop (≥901px) keeps `minmax(400px, 0.92fr) minmax(0, 1.08fr)`.
- ≤900px stacks to a single column with fluid widths, safe-area padding, and `overflow-x: clip`.
- Replaced bare `100vh` with `100vh` + `100dvh` on `.auth` / `.auth-side`.
- Cleared theme-toggle overlap: reserved right padding on the stacked side panel; toggle stays ≥44px.
- Scaled `<Logo size="lg" />` down on narrow via `.auth-brand .logo--lg` (desktop size unchanged).
- Hid `.auth-doodle-stamp` on stacked layouts; undo doodle `padding-left: 104px` ≤900 so notebook inset does not spill.
- Register `.grid-2` stacks to one column ≤520px; tap targets on auth controls ≥44px.

### Motion (kept, mobile-adjusted)
- Auth side stagger shortens on `narrow` / `lite` (`0.05` / `0.02`).
- Card still uses `scaleIn`; footer `fadeUp` delay shortens on narrow.
- No large X slide offsets; transform/opacity only.

### Files
- `client/src/styles.css`
- `client/src/doodle.css`
- `client/src/components/AuthLayout.jsx`

## Landing — 2026-11-06

### Study Space preview restored
- Removed `@media (max-width: 760px) and (max-height: 700px) { .study-preview { display: none } }` which hid the card on most phones.
- Short viewports now keep the card visible with tighter padding/type instead of hiding it.
- Forced `display: block; width/max-width: 100%` on ≤900px so the mockup always scales in the stacked hero.

### Blank content fix (follow-up)
- Cause: `useMotionCapability` seeded `narrow=false`, so phones briefly ran `clipReveal` at opacity 0, then flipped to `scaleIn` and stayed blank.
- Seed `narrow` / lite from the real viewport/device on first paint.
- Preview uses stable `fadeUp` (no clip/scale remount).

### Shake-on-refresh fix (follow-up)
- Entrance variants (`fadeUp`, `scaleIn`, `staggerItem`, `slideIn`) use tweens instead of soft springs (springs overshot and looked like shaking).
- Removed preview `key` remount; stopped forcing opacity in `Reveal` on complete.
- Landing nav scroll-shrink limited to desktop fine-pointer only.

### Layout
- Desktop fit: sticky nav/footer are full-bleed with `padding-inline` rail (no inset-only pseudo leaving side gaps).
- Hero columns use fluid `minmax(0, …)` (removed hard `480px`/`400px` floors that overflowed mid-size desktops).
- Desktop hero capped with `min(660px, 100dvh - nav)` and `overflow-x: clip`; dashed blob scaled down.
- Landing uses `100dvh` + `overflow-x: clip`.
- ≤900px: hide dashed hero blob + star; stack hero; Study Space full fluid width; CTA ≥44px; logo scales slightly.

### Motion (kept, mobile-adjusted)
- Narrow/lite: shorter nav/hero/method staggers.
- Preview uses `scaleIn` on narrow (avoids clip-path); desktop still `clipReveal`.

### Files
- `client/src/doodle.css`
- `client/src/styles.css`
- `client/src/pages/Landing.jsx`

## Quiz lists (mobile) — 2026-11-06

- Student quiz cards used horizontal `display: flex` on phones; the ≤520 rule only set `grid-template-columns` (no effect on flex), so title + actions overflowed the screen.
- ≤767px: cards stack (`flex-direction: column`); copy/`min-width: 0` + `overflow-wrap`; actions full-width ≥44px.
- Admin `/admin/quizzes`: create form file controls / choice editor / form actions stack at ≤767; student picker margin cleared; published rows stack; scores use labeled card rows at ≤640 (`data-label` on cells).
- Files: `client/src/styles.css`, `client/src/doodle.css`, `client/src/pages/Quizzes.jsx`, `client/src/pages/admin/Quizzes.jsx`.

## Next
- Shared Logo, student/admin shells, remaining app/admin pages.
- Cross-cutting motion mobile polish + verify build/lint.
