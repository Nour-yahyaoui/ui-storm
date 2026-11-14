# 0001 — Foundation stack: Vite, Tailwind v4, Storybook, Vitest, Playwright

- Status: accepted
- Date: 2026-11-14

## Context

The library needs: a component dev environment, an ESM build with type declarations, a stylesheet that supports RTL without a second code path, unit tests that can assert ARIA, and browser tests that can see contrast and layout. It also needs to stay adoptable by teams that do not use the same build tooling.

Options considered: Vite vs tsup vs Rollup directly; Tailwind v4 vs CSS Modules vs vanilla-extract; Storybook vs a custom docs app; Vitest vs Jest; Playwright vs Cypress.

## Decision

- **Vite (library mode)** for the build. One config serves dev, Storybook and the package build; `@vitejs/plugin-react` provides the JSX transform; declarations come from `tsc --emitDeclarationOnly` rather than a bundler plugin, which keeps the type output predictable.
- **Tailwind v4 with `@theme inline` + `@source`.** Utilities are generated only from shipped sources, and map to runtime CSS variables so dark mode and forced colors need no rebuild. Logical utilities make the RTL rule mechanical.
- **Storybook 10 with `@storybook/react-vite`**, the a11y addon, and locale/theme toolbar globals. Stories are the review surface and the Playwright fixture.
- **Vitest + jsdom + axe-core** for fast semantic tests, with an explicit, documented skip of the rules jsdom cannot evaluate.
- **Playwright + `@axe-core/playwright`** for contrast, geometry, reflow and keyboard behaviour, running against the built Storybook so the tested artifact is the deployed one.
- **ESLint with `jsx-a11y` on every TSX file** and `typescript-eslint` strict rules; Prettier for formatting.

## Consequences

- Consumers need only the compiled CSS; Tailwind is not a peer requirement.
- The published CSS stays small because Storybook-only utilities are excluded by `@source` scoping.
- Two test runners means two places to add coverage — mitigated by a written rule for which tier a test belongs to.
- Storybook 10 + Vite 8 are recent; upgrades need the browser suite green, which is why dependency updates are gated rather than automerged blindly.

## Alternatives considered

- **CSS Modules**: excellent scoping, but no logical-property shorthand layer and no token-driven utilities; every component would re-derive RTL rules.
- **vanilla-extract**: strong typing, but a build-time dependency for consumers and a steeper contribution curve.
- **tsup**: simpler declarations, but a second build pipeline next to Vite's.
- **Cypress**: heavier for the specific need (axe + geometry), and Playwright's multi-project setup maps cleanly to LTR/RTL/theme variants.
