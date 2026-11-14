# Accessibility statement

This document states what ui-storm guarantees, how each guarantee is checked, and what is
deliberately left to human review. It is written to be falsifiable: every claim below names the
mechanism that would catch its violation.

## Target

WCAG 2.2 level AA, plus the parts of AAA that cost nothing in a component library (visible labels,
no colour-only information, 44px touch targets on small controls).

## Guarantees

### Names are required by construction

An input cannot be rendered without a label; an icon button cannot be rendered without a name. The
signature rejects the broken version, so this is a compile error rather than a review comment.

*Checked by:* the type system, plus markup assertions in `crates/ui-storm/tests/components.rs`.

### Contrast is computed, not eyeballed

Every text pair the components use meets 4.5:1; every boundary, fill and focus ring meets 3:1, in
both themes. Ratios are computed with the WCAG 2.2 relative-luminance formula from the values the
stylesheet actually ships.

*Checked by:* `crates/ui-storm/src/tokens.rs`, which fails the build with the measured ratio in the
message. The gallery's foundations page shows the same table.

### The palette has one source

The stylesheet and the Rust token table are compared as ordered lists on every test run. A colour
added to one and not the other is a build failure, not a drift nobody notices for six months.

*Checked by:* `stylesheet_palette_matches_the_rust_tokens`.

### State is never carried by colour alone

Errors carry text and `aria-invalid`; loading carries `aria-busy` and words; selection carries
`aria-selected`; required carries native `required` plus visually hidden words.

*Checked by:* the markup contract tests, and axe in the browser run.

### Focus is always visible

One ring for the whole library: 3px, offset 2px, in the accent colour, audited against every surface
it can land on. `:focus-visible` is used, so pointer users do not see it, but no component ever sets
`outline: none`.

*Checked by:* the contrast audit for the colour, and `tests/e2e/keyboard.spec.ts` for the behaviour.

### Content does not depend on JavaScript

Markup is complete before any script runs. With scripting disabled, tab panels are revealed by a
`<noscript>` rule in the page head, dialogs remain closed but their content is not the only route to
anything, and every form still submits.

*Checked by:* the Playwright run with `javaScriptEnabled: false`.

### Right-to-left is structural

The stylesheet contains no physical property: no `left`, no `right`, no `margin-left`, no
`text-align: left`. The test fails the build on any of them. Mirroring is a property of the layout,
not a second stylesheet.

*Checked by:* `stylesheet_uses_only_logical_properties`, and the axe and geometry runs with
`?lang=ar`.

### Motion is optional

Every transition and animation is disabled under `prefers-reduced-motion: reduce`, including the
button spinner. No state is communicated by movement alone.

*Checked by:* the reduced-motion block in the stylesheet and the contrast-independent loading text.

### Structure is machine-checkable

Every page has exactly one `h1`, a skip link pointing at a focusable `main`, landmarks, and a
language and direction on `<html>`.

*Checked by:* `crates/ui-storm-web/tests/gallery.rs` and `tests/e2e/gallery.spec.ts`.

## What is reviewed by hand

axe catches roughly a third of real-world issues. These are not automated, and are reviewed per
release:

| Area | What a human checks |
| --- | --- |
| Name quality | A name can be present and still useless ("button", "icon", "×"). |
| Order | The DOM order matches the visual order, in both directions. |
| Announcements | Whether a live region announcement arrives at the right moment, once. |
| Reading flow | Whether the content makes sense read linearly, as a screen reader does. |
| Zoom and reflow | 200% zoom and 320px width remain usable, not just non-overflowing. |
| Pointer targets | Minimum target size at the smallest breakpoint, on a touch device. |

The manual matrix is tracked as a backlog issue in the `testing` milestone: NVDA with Firefox,
VoiceOver with Safari, TalkBack with Chrome on Android.

## Known limits

- The gallery is not a screen-reader conformance suite; see above.
- The visible strings the library renders itself ("Close dialog", "Loading", "(required)") are
  English by default and injectable per component. Localising them across every component at once is
  a backlog item.
- The dialog's initial focus is the first focusable element. For destructive dialogs, order the
  actions so the safe one comes first; an explicit initial-focus option is planned.
- Determinate progress and toast timing are not announced in a way that survives an assertive
  interruption yet; both components are still planned.

## Reporting a barrier

Use the accessibility issue template. Barrier reports are triaged with the same urgency as security
reports, and the fix ships with a test that would have caught it.
