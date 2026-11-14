# 3. Bound the enhancement script

- Status: accepted
- Date: 2026-11-14

## Context

A server-rendered component library still needs behaviour that HTML cannot express: modal dialogs
before `<dialog>`, tab keyboard navigation, the indeterminate checkbox state, and focus return. The
temptation is to reach for a client framework, or to grow a script until it is one.

## Decision

`crates/ui-storm/assets/ui-storm.js` is a single classic script, dependency-free, under 6 kB
unminified, with a strict scope:

- It **adds behaviour** and never content.
- It **prefers the platform**: `<dialog>` provides the focus trap, Escape, inert background and the
  top layer; `<details>` provides accordion state; native inputs provide their own keyboard handling.
- It defends the no-JavaScript case explicitly: a `<noscript>` rule in the page head reveals every
  tab panel, so tabs degrade to a list of sections rather than losing content.
- It never writes markup (`innerHTML`), never evaluates a string, and never touches anything it did
  not opt into through a `data-ui-*` attribute.

A unit test asserts the script contains no `innerHTML`, no `document.write` and no `eval`. A
Playwright run with `javaScriptEnabled: false` asserts the pages are still readable.

## Consequences

- Interactive components must be designed twice: the markup-first version and the enhancement. Tabs
  and dialogs pay this cost; buttons and inputs do not, because the platform already handles them.
- Some patterns are out of scope until they can be built this way — a virtualised data grid, for
  example, is not on the near-term roadmap.
- The library can be used in environments that forbid JavaScript entirely, with a documented (small)
  set of degradations.

## Alternatives considered

- **A client framework.** Reintroduces hydration, a bundle and a build step, which is what the
  rewrite exists to remove.
- **Web components.** Attractive for encapsulation, but they hide state from the server renderer and
  break the "markup is the source of truth" property.
- **No script at all.** Honest, but tabs and dialogs would be worse for everyone rather than better
  for some.
