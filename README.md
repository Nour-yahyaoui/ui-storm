# Accessible UI Lab

An accessibility-first React + TypeScript component library with **first-class Arabic and RTL support**.

Most component libraries treat right-to-left as a stylesheet flip and accessibility as a checklist applied at the end. This one starts from the opposite direction: the keyboard contract, the ARIA semantics and the bidi behaviour are designed first, and the visual layer follows.

> [!IMPORTANT]
> This repository is at **foundation stage**. The tokens, direction layer, test harness, Storybook and CI are implemented and green.
> The components themselves — starting with `Button`, `Input`, `Checkbox`, `Dialog` and `Tabs` — are tracked as individual
> GitHub issues in [12 milestones](docs/backlog.md) and land one issue at a time.

[![CI](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/ci.yml/badge.svg)](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/ci.yml)
[![Storybook](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/storybook-pages.yml/badge.svg)](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/storybook-pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)

## Why this exists

Arabic is written right to left, with a cursive script, contextual letterforms, diacritics above and below the baseline, its own numeral systems, and a calendar that is not Gregorian in several countries. A library that only mirrors its margins gets none of that right.

At the same time, accessibility features that Arabic-speaking users depend on — visible focus, screen reader announcements, keyboard paths, forced-colors support — are usually bolted on late, if at all.

Accessible UI Lab treats both as product requirements with tests attached.

## What is implemented today

| Area                                                                              | Status                                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Design tokens (light, dark, high contrast, forced colors)                         | ✅ `src/styles/tokens.css`, 28 automated contrast checks           |
| Direction layer (`DirectionProvider`, `useDirection`, locale → dir)               | ✅ including script subtags (`az-Arab`) and nested overrides       |
| Focus utilities (`getTabbableElements`, `getFocusableElements`, focus first/last) | ✅ with unit tests                                                 |
| Test harness (`render` with direction, `expectNoA11yViolations`)                  | ✅ guards itself against false negatives                           |
| Storybook with locale + theme toolbars and the a11y addon                         | ✅ three foundation story sets                                     |
| Playwright + axe-core browser suite                                               | ✅ LTR/RTL WCAG scans, direction geometry, 320px reflow, dark mode |
| CI (types, lint, unit, contrast, build, backlog sync, browser tests)              | ✅ two workflows                                                   |
| Components                                                                        | 🚧 tracked as 376 issues across 12 milestones                      |

### The foundation, concretely

- **Tokens are the only source of color, spacing, radius and motion.** Components never hard-code a value, so dark mode, `prefers-contrast` and Windows High Contrast work without recompiling.
- **Two border tokens exist on purpose.** `--aui-color-border` is decorative; `--aui-color-border-strong` meets the 3:1 non-text contrast requirement for control boundaries (WCAG 1.4.11).
- **Direction is resolved once.** `getDirectionFromLocale('ar-EG')` → `rtl`, including script subtags, so `az-Arab` is RTL while `az-Latn` is not. `DirectionProvider` sets `dir` and `lang` on a wrapper, which is what makes CSS logical properties and `:lang(ar)` Arabic typography work.
- **Contrast is checked mechanically.** `npm run test:contrast` parses the real token file and asserts 14 documented pairs in both themes.
- **The a11y harness tests itself.** `src/test-utils/axe.test.tsx` asserts that axe catches a missing `alt` and an unlabelled input. If the harness silently stopped reporting, those tests fail.

## Quick start

```bash
git clone https://github.com/Nour-yahyaoui/ui-storm.git
cd ui-storm
npm install
npm run dev          # Storybook on http://localhost:6006
npm run verify       # types, lint, format, unit tests, contrast, build
```

### Using the foundation

```tsx
import { DirectionProvider, useDirection, cn } from 'accessible-ui-lab';
import 'accessible-ui-lab/styles.css';

export function App() {
  return (
    <DirectionProvider locale="ar-EG">
      <Invoice />
    </DirectionProvider>
  );
}

function Invoice() {
  const { dir, isRTL } = useDirection();

  return (
    // Logical utilities: no `ml-*`/`left-*` anywhere, so this works in both directions.
    <section
      className={cn('rounded-lg border border-border bg-surface p-4', 'text-start')}
      dir={dir}
    >
      <h2 className="font-semibold">فاتورة</h2>
      <p className="text-muted">{isRTL ? 'اتجاه من اليمين إلى اليسار' : 'Left to right'}</p>
    </section>
  );
}
```

The stylesheet must be imported once by the host app. It is compiled CSS — **consumers do not need Tailwind**.

## Arabic and RTL

Four rules the library enforces, each with a test:

1. **Logical properties only.** `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`, `border-s`/`border-e`. Physical margins in component source are a review blocker and, soon, a lint error.
2. **Icons mirror by meaning, not by habit.** Arrows mirror; checkmarks, clocks, logos and media controls do not.
3. **Numbers are a product decision.** Arabic-Indic (`٠١٢٣`) and Western digits both exist; each locale gets an explicit choice, not a font default.
4. **Embedded Latin text is isolated.** Identifiers, phone numbers and URLs inside Arabic sentences are wrapped in `bdi` or `dir="ltr"`.

Read [docs/rtl-and-arabic.md](docs/rtl-and-arabic.md) for the full guidance, including Hijri calendar caveats and the mixed-script checklist.

## Accessibility

The target is **WCAG 2.2 AA**, verified rather than asserted:

- **Automated, in jsdom:** roles, names, states, ARIA relationships, heading structure — via axe-core, with contrast and target size explicitly _not_ faked (jsdom has no layout).
- **Automated, in a real browser:** WCAG A/AA scans in LTR and RTL, dark mode, direction geometry, 320px reflow without horizontal scrolling.
- **Automated, static:** token contrast ratios computed from the source tokens.
- **Manual, per component issue:** keyboard walkthrough and a VoiceOver/NVDA pass, recorded in the issue.

What is _not_ claimed: this repository has no manual screen reader sign-off yet for the components, because the components do not exist yet. [docs/accessibility.md](docs/accessibility.md) states exactly what is proven, how, and what remains.

## Scripts

| Script                            | What it does                                                |
| --------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                     | Storybook on port 6006                                      |
| `npm run build`                   | ESM library build + type declarations (`dist/`)             |
| `npm run build:storybook`         | Static Storybook in `storybook-static/`                     |
| `npm run typecheck`               | `tsc --noEmit` over source, tests, stories and configs      |
| `npm run lint`                    | ESLint with `jsx-a11y` on every TSX file                    |
| `npm run format` / `format:check` | Prettier                                                    |
| `npm test`                        | Vitest (jsdom) including axe assertions                     |
| `npm run test:coverage`           | Vitest + v8 coverage with thresholds                        |
| `npm run test:contrast`           | WCAG contrast checks against the real token file            |
| `npm run test:e2e`                | Playwright + axe-core against the built Storybook           |
| `npm run backlog:build`           | Regenerate `backlog/backlog.json` and `docs/backlog.md`     |
| `npm run backlog:publish`         | Create labels, milestones and issues on GitHub (idempotent) |
| `npm run verify`                  | Everything that must be green before a PR                   |

> `npm run test:e2e` needs a Playwright browser: `npx playwright install chromium`. The sandbox in which this foundation was built had no access to the browser CDN, so the browser suite is verified by CI, not locally. Everything else was run locally.

## Project structure

```
.
├── .github/
│   ├── ISSUE_TEMPLATE/        # accessibility barrier, bug, proposal
│   ├── workflows/ci.yml       # types, lint, unit, contrast, build, backlog, browser
│   └── workflows/storybook-pages.yml
├── .storybook/                # locale + theme toolbars, a11y addon
├── backlog/                   # source of truth for the 376 issues
│   ├── catalog.mjs            # 53 components and their accessibility contracts
│   ├── tracks.mjs             # API / keyboard / ARIA / RTL / docs / tests generators
│   ├── initiatives/           # cross-cutting issues by milestone
│   └── backlog.json           # generated, published to GitHub
├── docs/                      # accessibility, RTL, architecture, testing, backlog
├── scripts/
│   ├── build-backlog.mjs      # deterministic backlog generation + validation
│   ├── publish-backlog.mjs    # idempotent GitHub publisher
│   └── check-contrast.mjs     # WCAG contrast checks on tokens
├── src/
│   ├── foundations/           # token, direction and typography stories + tests
│   ├── hooks/useDirection.ts
│   ├── lib/                   # cn, direction, focus, mergeRefs
│   ├── providers/             # DirectionProvider + context
│   ├── styles/                # tokens, Tailwind theme mapping, base layer
│   └── test-utils/            # direction-aware render, axe harness
└── tests/e2e/                 # Playwright + axe
```

## Roadmap

The backlog is generated from `backlog/` so it cannot drift from the code:

| Milestone                      | Focus                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| 00 · Foundations & tooling     | focus trap, dismiss, portals, live regions, SSR harness, scaffolding                 |
| 01 · Core primitives           | Button, IconButton, Link, Text, Heading, VisuallyHidden, Spinner, Badge, Kbd, Avatar |
| 02 · Form controls             | Field, Input, Checkbox, Radio, Switch, Select, Combobox, Slider, DatePicker          |
| 03 · Overlays & messaging      | Dialog, AlertDialog, Drawer, Popover, Tooltip, Menu, Toast, CommandPalette           |
| 04 · Navigation & structure    | Tabs, Accordion, Breadcrumbs, Pagination, TreeView, SkipLink                         |
| 05 · Data display              | Table, DataTable, Progress, Meter, Skeleton, EmptyState, Card, Timeline, CodeBlock   |
| 06 · RTL & Arabic i18n         | fonts, numerals, calendars, pluralisation, screen reader matrix                      |
| 07 · Accessibility conformance | forced colors, reflow, text spacing, target size, ACR                                |
| 08 · Documentation             | docs site, keyboard tables, accessibility statement, Arabic docs                     |
| 09 · Quality engineering       | visual regression, mutation testing, browser matrix, tarball tests                   |
| 10 · Release                   | changesets, provenance, exports validation, size budgets                             |
| 11 · Adoption & DX             | theming, dark mode, framework guides, Figma sync, codemods                           |

See [docs/backlog.md](docs/backlog.md) for every issue, and `npm run backlog:publish` to reproduce the GitHub backlog.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Two rules matter more than the rest:

1. **A component issue is not done without evidence** — axe passing, a keyboard spec, an Arabic story and a documented ARIA contract.
2. **Physical CSS properties in component source are a bug.** If you need `ml-4`, you need `ms-4`.

Arabic-speaking contributors are especially welcome: the glossary, translations and screen reader matrix all need native review.

## License

[MIT](LICENSE).
