## What and why

<!-- Link the issue: Closes #123. Explain the user-facing effect, not the file changes. -->

## Accessibility checklist

Everything here is required for component work. Delete the sections that do not apply and say why.

- [ ] Keyboard: every interaction is reachable and operable without a pointer, and focus is visible
- [ ] Screen reader: names, roles and states are correct (axe passes, plus a manual pass where relevant)
- [ ] RTL: logical properties only; the Arabic story renders without clipping or broken wrapping
- [ ] Contrast: no new color pair below its WCAG threshold (`npm run test:contrast`)
- [ ] Reduced motion: animation collapses or is skippable
- [ ] Target size: interactive elements are at least 44×44 CSS pixels or documented as exempt

## Tests

- [ ] Unit tests added or updated (LTR and RTL)
- [ ] Playwright spec added or updated for the keyboard path
- [ ] Storybook stories updated (states, RTL, dark mode)
- [ ] `npm run verify` passes locally

## Documentation

- [ ] Docs page updated, including keyboard table and ARIA contract
- [ ] Changeset added (`npm run changeset` or the file is included) when user-facing
- [ ] Breaking change? Labelled `breaking-change` and migration notes written

## Screenshots

<!-- Required for visual changes: LTR and RTL, light and dark. -->
