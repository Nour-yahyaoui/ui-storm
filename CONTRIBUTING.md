# Contributing

Thanks for helping. This library exists because accessible, RTL-native components are hard to find, and they are only trustworthy if every claim has a test behind it.

## Setup

```bash
npm install
npx playwright install chromium   # only needed for the browser suite
npm run dev                       # Storybook on :6006
npm run verify                    # what CI runs, minus the browser suite
```

Node 22 is required (see `.nvmrc`).

## Finding work

- Issues are grouped into 12 milestones. Start with **00 · Foundations & tooling** unless you are picking up a component.
- `good first issue` marks work that is scoped, documented and reviewable in one sitting.
- Every issue states its acceptance criteria. If an issue is unclear, ask in the issue before writing code — that is useful signal, not noise.

## The component lifecycle

A component is done when all of the following exist. This is also the checklist reviewers use.

1. **Implementation** — token-only styling, `ref` forwarding, controlled and uncontrolled modes, development warnings for invalid usage.
2. **Accessibility contract** — the WAI-ARIA pattern named in the issue, implemented as written. No extra roles "for safety".
3. **Keyboard** — the documented key map works, focus stays visible, and no positive `tabindex` exists.
4. **RTL** — logical properties only, an Arabic story that does not clip, bidi isolation for embedded Latin text.
5. **Tests** — unit tests via `render` from `src/test-utils/render.tsx` in both directions, `expectNoA11yViolations`, and a Playwright spec for the keyboard path.
6. **Stories** — every state, plus RTL and dark mode.
7. **Docs** — a page with when-to-use, anatomy, keyboard table, ARIA table, RTL notes, examples and common mistakes.
8. **Changeset** — `minor` for a new component, `patch` for a fix.

## Testing accessibility locally

```bash
npm test                 # jsdom + axe, includes the harness self-test
npm run test:coverage    # same, with thresholds
npm run test:contrast    # token contrast pairs, light and dark
npm run test:e2e         # Playwright + axe against the built Storybook
```

`npm run test:e2e` builds Storybook first. It is the only suite that can see color contrast, layout and reflow — jsdom cannot, and the jsdom suite deliberately skips those rules rather than pretending.

### Manual screen reader pass

For component work, do at least one of:

- **VoiceOver** (macOS): `Cmd+F5`, then use `VO+Right` to walk elements.
- **NVDA** (Windows, free): enable speech viewer to read announcements.
- **TalkBack** (Android): swipe navigation, focus indicator enabled.

Record in the issue: what was announced, in which order, and anything missing. A screen reader pass cannot be automated away.

### Arabic and RTL checks

- Switch the Storybook **Locale** toolbar to `العربية (RTL)`; the toolbar sets `dir` and `lang`, not just a class.
- Add mixed content: an Arabic sentence containing a Latin identifier, a phone number and a URL. That is where bidi breaks.
- Check numerals: Arabic-Indic digits are correct for some locales, wrong for others. Do not assume.
- Read [docs/rtl-and-arabic.md](docs/rtl-and-arabic.md) before touching layout.

## Code conventions

- **No physical CSS properties.** Use `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`. A lint rule is tracked in the backlog.
- **No literal colors, radii or durations.** Use `--aui-*` tokens.
- **No `any` in public types.** No `@ts-ignore` without an explanation in the same line.
- **`cn()` merges classes; it does not resolve Tailwind conflicts.** Expose variants instead of relying on override order.
- **Names are accessible by construction.** An icon-only control without a name should be a type error, not a review comment.

## Changesets

```bash
npx changeset
```

Pick `minor` for new components and `patch` for fixes. Breaking changes during 0.x bump the minor and must be labelled `breaking-change` with migration notes.

## Backlog changes

The backlog is generated. Do not edit `backlog/backlog.json` by hand.

```bash
# edit backlog/catalog.mjs, backlog/config.mjs or backlog/initiatives/*
npm run backlog:build     # regenerate JSON + docs/backlog.md
npm run backlog:check     # what CI runs
npm run backlog:publish   # create labels, milestones and issues (idempotent)
```

The generator rejects duplicate titles, unknown labels, unknown dependencies and dependency cycles, so a broken change fails locally instead of creating a mess on GitHub.

## Pull requests

Fill in the accessibility checklist honestly. Delete sections that do not apply and say why. Include LTR and RTL screenshots for visual changes. A PR without a changeset fails CI.
