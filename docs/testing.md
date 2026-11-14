# Testing

## Commands

```bash
npm test                 # Vitest (jsdom), axe assertions included
npm run test:coverage    # same with v8 coverage and thresholds
npm run test:contrast    # token contrast checks, light and dark
npm run test:e2e         # Playwright against the built Storybook
npm run test:e2e:install # downloads Chromium (needs network access to the Playwright CDN)
npm run verify           # types, lint, format, unit, contrast, build
```

## The three tiers

### 1. Vitest + jsdom

Fast, and good at semantics: roles, names, `aria-describedby` wiring, direction resolution, focus utilities, controlled/uncontrolled transitions.

It is bad at anything spatial. jsdom has no layout engine, so:

- `color-contrast` and `target-size` are **skipped by design** (`src/test-utils/axe.ts`);
- element visibility is inferred from attributes and computed style, not geometry;
- scroll behaviour is simulated.

If a test needs geometry, it belongs in tier 2.

### 2. Playwright + axe + Storybook

Runs against the compiled Storybook, so it also proves the stories build and the tokens resolve. Current specs (`tests/e2e/foundations-a11y.spec.ts`):

- WCAG A/AA scans of every foundation story in LTR, Arabic RTL and dark mode;
- `dir`/`lang` wiring from the locale global;
- mirrored geometry: an accent bar using `inset-inline-start` sits left in LTR and right in RTL;
- 320px reflow in RTL: `scrollWidth - clientWidth <= 1`;
- directional icon mirroring via computed transform.

The Playwright config builds and serves Storybook itself (`webServer`), so there is no separate "start the server first" step.

### 3. Manual screen reader

Not replaceable. See CONTRIBUTING for the minimum pass (VoiceOver, NVDA or TalkBack) and record findings in the issue.

## Writing a component test

```tsx
import { render, screen } from '../test-utils/render';
import { expectNoA11yViolations } from '../test-utils/assertA11y';

it('is labelled and reachable in both directions', async () => {
  const { container } = render(<MyControl />, { dir: 'rtl', locale: 'ar-EG' });

  expect(screen.getByRole('button', { name: /حفظ/ })).toBeInTheDocument();
  await expectNoA11yViolations(container);
});
```

`render` wraps the tree in `DirectionProvider`, so every test can be flipped to RTL without duplicating markup.

## Coverage policy

Coverage is a floor, not a goal:

- `src/lib` (focus, direction, cn, mergeRefs) is expected to be near 100% — these are the primitives everything depends on.
- Components: 90% lines and branches once they exist.
- `src/test-utils` is excluded: it is the harness, and it is tested by its own meta-test (`axe.test.tsx`).

Thresholds currently fail the build at 80/80/75/80 (lines/functions/branches/statements). Per-directory thresholds are tracked in `qa-coverage-per-directory`.

## Test quality rules

- **No `waitForTimeout`.** Use fake timers, `findBy*` queries or explicit expectations.
- **No snapshot of markup.** It hides intent and approves regressions. Assert the behaviour.
- **One reason to fail per test.** A test that fails for three possible causes wastes triage time.
- **Failing tests must fail for the right reason.** When adding an a11y test, break the markup once and confirm the test notices.

## CI

`.github/workflows/ci.yml` runs three jobs:

1. **quality** — format, lint, types, unit tests with coverage, contrast, library build, backlog sync.
2. **storybook** — static build (also the artifact the browser job tests).
3. **e2e** — Playwright with Chromium, uploading the report, traces and screenshots on failure.

Browser matrix (Firefox/WebKit), visual regression and sharding are tracked issues, not silent gaps.
