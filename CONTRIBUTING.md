# Contributing

Thanks for taking the time. This project has two hard rules, and everything else is negotiable.

1. **Accessibility is a build gate, not a review opinion.** If a change makes a guarantee untested,
   the change is incomplete.
2. **Direction is structural.** A component that only works in LTR is not finished.

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Rust | 1.82 (see `rust-toolchain.toml`) | Everything |
| Python | 3.11+ | `scripts/build_backlog.py` |
| Node | 22 | Playwright and axe only; the library is Rust |

## Commands

| Command | What it does |
| --- | --- |
| `cargo fmt --all` | Formatting. CI reports drift but does not block on it, so run this before pushing |
| `cargo clippy --workspace --all-targets -- --deny warnings` | Lints; warnings are errors |
| `cargo test --workspace` | Unit, markup contract and HTTP tests |
| `cargo run --package ui-storm-web` | The gallery on `0.0.0.0:8080` |
| `npx playwright test` | axe, keyboard, RTL and no-JavaScript runs |
| `python3 scripts/build_backlog.py --check` | The backlog matches its generator |

`npx playwright test` starts the real gallery binary through `webServer` in `playwright.config.ts`;
you do not need to run the server yourself.

## Adding or changing a component

A component is done when all seven of these are done. They mirror the seven issues the backlog opens
per component, and the review checklist on a pull request.

1. **API** — a builder in `crates/ui-storm/src/components/<name>.rs`. `new(..)` takes every prop
   with no safe default, and that includes names: a component whose accessible name can be omitted
   is a bug. Borrow `&'a str`; do not allocate for static text.
2. **Markup** — the native element first. The role comes from the platform; `aria-*` only describes
   relationships the platform cannot. Render from a pure function; no request access, no globals.
3. **Keyboard** — every interactive part is reachable and operable, focus is visible, and composite
   widgets have exactly one tab stop. Arrow keys follow the reading direction.
4. **RTL** — logical properties only. Test with `?lang=ar`, where the server sets `dir="rtl"`.
5. **Styles** — token colours only, every state covered, dark theme and `forced-colors` checked,
   motion disabled under `prefers-reduced-motion`.
6. **Docs** — a gallery page with live demos, the ARIA contract, a keyboard table, and the real
   rendered markup (call `render()`, do not paste a copy).
7. **Tests** — markup assertions in `crates/ui-storm/tests/components.rs`, the page in the axe run,
   and the interaction in `tests/e2e/keyboard.spec.ts`.

## CSS rules

- No physical properties. Not `left`, not `right`, not `margin-left`, not `text-align: left`. The
  test `stylesheet_uses_only_logical_properties` fails the build either way, so save yourself the
  round trip.
- No colour outside the token block. If you need a new one, add it to the `:root` block **and** to
  `src/tokens.rs`, then audit it in both themes.
- No `!important` outside the reduced-motion block, and no inline styles from components.
- Prefer the platform: `:focus-visible`, `:disabled`, `accent-color`, `<dialog>`, `<details>`.

## Tests

- A markup test asserts the contract, not a snapshot of the whole string.
- A behaviour test drives the real page through Playwright; do not mock the DOM.
- Never weaken an assertion to make a change pass. If the assertion is wrong, fix it deliberately
  and say why in the pull request.
- New pages must be added to `PAGES` in `tests/e2e/gallery.spec.ts` so axe runs on them.

## Backlog

The backlog is generated. Do not edit `docs/backlog.md` or `backlog/issues.json` by hand — change
`scripts/build_backlog.py` and regenerate. If you are picking something up, comment on the issue so
two people do not build the same component.

## Pull requests

- One logical change per pull request. A component plus refactors plus a docs overhaul is three.
- The description says what changed, why, and what you checked. The template asks for the
  accessibility impact because most changes have one.
- CI must be green. Reviewers will not merge red. The formatting step is reported
  separately: apply it, but a formatting diff alone will not fail the run.
- Commit messages are plain and imperative: `Add select component`, `Fix tab focus in RTL`.

## Reporting problems

- Bug or feature: the issue templates.
- Accessibility barrier: the accessibility template; these are triaged like security issues.
- Security vulnerability: [`SECURITY.md`](SECURITY.md), never a public issue.

## Code of conduct

Be decent. Assume competence and good faith, criticise the change and not the person, and make room
for the people this library exists for.
