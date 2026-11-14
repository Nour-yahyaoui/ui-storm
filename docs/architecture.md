# Architecture

## Goals, in priority order

1. **Accessibility is a property of the API, not a layer on top.** A control that cannot be named is a type error; a keyboard path that is not tested is unfinished.
2. **RTL is native.** Direction is resolved once and expressed with logical properties, so a component has one code path, not two.
3. **Consumers should not need our build tooling.** The published artifact is ESM plus compiled CSS. Tailwind is an implementation detail.
4. **Every claim is testable.** If a README sentence says "no physical margins", a script or a test should be able to fail.

## Layers

```
tokens.css        →  CSS custom properties (light, dark, contrast, forced colors)
base.css          →  direction-agnostic resets, focus treatment, Arabic typography
index.css         →  Tailwind theme mapping (@theme inline) + compiled stylesheet
lib/              →  DOM utilities: cn, direction, focus, mergeRefs
providers/        →  DirectionProvider (dir + lang), context
hooks/            →  useDirection and, as they land, useFocusTrap / useDismiss / ...
components/       →  accessible components (empty at foundation stage)
```

The dependency rule is one-way: components may depend on hooks, providers, lib and tokens. Nothing in `lib/` may import a component.

## Why Tailwind v4 with `@theme inline`

- Utilities are generated from the source files that actually ship (`@source`), so Storybook-only classes never reach consumers. The published CSS is ~9 kB (2.7 kB gzipped) with no component styles yet.
- `@theme inline` maps utilities to runtime CSS variables. Dark mode, `prefers-contrast` and forced colors therefore work by changing variables — no rebuild, no duplicated stylesheet.
- Logical utilities (`ms-*`, `ps-*`, `start-*`) are first-class, which makes the RTL rule enforceable by inspection instead of a special case.

The trade-off: consumers who want to extend utilities need Tailwind v4 themselves. The fallback — importing compiled CSS and using tokens directly — is supported and documented.

## Why a wrapper element for direction

`DirectionProvider` renders `dir` and `lang`. React context cannot drive CSS logical properties; only the DOM attribute can. Setting it on a wrapper also means:

- `:dir()` and `rtl:` variants work without JavaScript;
- `:lang(ar)` typography applies to descendants;
- SSR produces the correct direction in the first byte, avoiding a flash.

For layouts where a wrapper is impossible, `as="none"` keeps context only and the host must set `dir` itself — documented as a deliberate downgrade.

## Portals, layers and focus

Planned primitives (issues `fnd-portal-stack`, `fnd-focus-trap`, `fnd-scroll-lock`, `fnd-dismiss`):

- A single provider owns a portal container and assigns each layer an index exposed as a CSS variable.
- The focus trap only considers the topmost layer, and restores the previous trap when it closes.
- Scroll locking is reference counted so nested overlays cannot unlock the page early.

This is why those issues come before Dialog in the backlog: five components share one implementation instead of five subtly different ones.

## Testing strategy

Three tiers, each with a reason to exist:

| Tier                         | Runs                     | Coverage                                                              |
| ---------------------------- | ------------------------ | --------------------------------------------------------------------- |
| Vitest + jsdom               | every push, seconds      | logic, ARIA relationships, direction resolution, axe structural rules |
| Playwright + axe + Storybook | every push (CI), minutes | contrast, geometry, reflow, focus behaviour, theme                    |
| Manual screen reader         | per component issue      | announcements, reading order, comprehension                           |

Details in [testing.md](testing.md).

## Package output

- `dist/accessible-ui-lab.js` — ESM, React externalised.
- `dist/accessible-ui-lab.css` — compiled tokens, base layer and component utilities.
- `dist/index.d.ts` — declarations from `tsc --emitDeclarationOnly`.

Exports are declared in `package.json` (`"."` and `"./styles.css"`). Per-component subpaths, tree-shaking verification and exports validation are tracked in the release milestone.

## Decisions that are still open

Recorded as ADRs when decided:

- composition strategy (`asChild` vs polymorphic `as`) — `fnd-composition-decision`
- `aria-disabled` vs native `disabled` defaults — `a11y-disabled-pattern`
- CSS distribution for consumers — `rel-css-distribution`
- positioning: build vs adopt floating-ui — `fnd-popup-positioning`
