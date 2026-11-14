# Accessibility

Target: **WCAG 2.2 Level AA**, with selected AAA practices (44px targets, 7:1 body text in the light theme).

This page states what is verified, how, and what is not yet verified. It is deliberately specific: "accessible" is a claim, and claims need evidence.

## What is automated

| Check                                | Where                                                  | What it cannot see             |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------ |
| WCAG A/AA rule set (axe-core)        | `src/**/*.test.tsx` via `expectNoA11yViolations`       | contrast, layout, focus order  |
| WCAG A/AA rule set in a real browser | `tests/e2e/foundations-a11y.spec.ts`, LTR + RTL + dark | screen reader output, meaning  |
| Token contrast ratios                | `scripts/check-contrast.mjs`, 14 pairs × 2 themes      | rendered compositing, images   |
| Direction geometry and 320px reflow  | Playwright bounding boxes and scroll width             | content readability            |
| Accessible names/roles/states        | axe + explicit assertions                              | whether the name is _useful_   |
| Keyboard paths                       | Playwright per component (as components land)          | whether the model is learnable |

**Contrast is never checked in jsdom.** `src/test-utils/axe.ts` explicitly skips `color-contrast` and `target-size` because jsdom has no layout engine; those rules run only in the Playwright suite. Skipping them silently would make every green run a lie.

## What requires a human

- Screen reader output on VoiceOver, NVDA and TalkBack, in English **and Arabic**.
- Whether the reading order matches the visual order in complex layouts.
- Whether error messages explain the fix.
- Whether a keyboard user can complete a task without instruction.
- Whether Arabic text with diacritics is legible at the shipped sizes.

These are tracked as per-component issues (`a11y-sr-matrix`, `rtl-screen-reader-matrix`) and are recorded in the issue, not just in a release note.

## Current evidence

At foundation stage, the following is proven by the repository:

- 69 unit tests pass, including two that assert the axe harness itself catches a missing `alt` and an unlabelled input.
- 28 token contrast checks pass in light and dark themes (body text 17.85:1 light / 16.96:1 dark on surface; control borders 4.76:1 / 6.92:1).
- Direction resolution is tested for 13 locales plus script-subtag overrides.
- Tab-order utilities are tested for positive `tabindex` ordering, `inert`, `aria-hidden`, disabled fieldsets and hidden elements.
- The browser suite (CI only) scans every foundation story in LTR, RTL and dark mode and asserts RTL geometry and 320px reflow.

Not yet proven, because the components do not exist: per-component keyboard and screen reader sign-off, forced-colors rendering of component surfaces, and the ACR.

## Known limitations

| Limitation                                 | Impact                                            | Tracking                   |
| ------------------------------------------ | ------------------------------------------------- | -------------------------- |
| No screen reader matrix yet                | component semantics are unverified for real users | `a11y-sr-matrix`           |
| Forced-colors verified at token level only | component borders may still vanish                | `a11y-forced-colors`       |
| No component-level reflow evidence         | dense tables may scroll horizontally              | `a11y-reflow`              |
| No ACR/VPAT                                | procurement teams cannot file it                  | `a11y-acr`                 |
| Arabic screen reader behaviour untested    | RTL announcements may be wrong                    | `rtl-screen-reader-matrix` |

## Reporting a barrier

Use the **Accessibility barrier** issue template. Include the assistive technology and versions, the steps, and the WCAG criterion if you know it. Reports from disabled users are prioritised over general bugs.

If the barrier is a security issue (for example a focus trap that exposes a private view), use the process in `SECURITY.md`.

## Principles behind the component contracts

1. **Prefer native semantics.** A native `button`, `input` or `fieldset` beats a div with roles, because browsers, screen readers and form APIs already agree about it.
2. **Never convey meaning with color alone.** Every status carries text; icons are supplementary.
3. **Disabled controls stay discoverable where possible.** Native `disabled` removes controls from the tab order and from screen reader discovery; `aria-disabled` is the default for actions, with documented exceptions.
4. **Focus is a contract.** Opening, closing, and removing content must move focus deliberately — never leave it on `body`.
5. **Announce once.** Duplicate live-region messages are as bad as silence.
6. **No keyboard traps outside modals.** If an overlay traps focus, Escape must have a defined behaviour.
