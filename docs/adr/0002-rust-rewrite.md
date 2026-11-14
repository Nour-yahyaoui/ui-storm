# 2. Rebuild the library in Rust with server-rendered HTML

- Status: accepted
- Date: 2026-11-14
- Supersedes: the React/TypeScript implementation of `ui-storm`

## Context

The project started as "Accessible UI Lab", a React and TypeScript component library with Storybook
documentation. It shipped a foundation, six primitives, a test suite, a CI pipeline and a backlog of
376 issues.

Two problems emerged.

**The first was structural.** A React component library can only assert accessibility in a browser,
through the consumer's build, at the point where components are actually assembled. The guarantees
we care about — a name that cannot be omitted, a direction that comes from the locale, a palette that
cannot fail contrast — are all things a type system and a test suite can hold, but React's prop model
makes the accessible version the *default* rather than the *only* version.

**The second was fit.** The audience for this library is teams building Arabic-first products, most
of whom are on the JVM, .NET, Python or Rust on the server. A React library serves a fraction of
them, and the parts that make the library good (logical CSS, locale direction, contrast maths) are
framework-independent anyway.

## Decision

Replace the TypeScript implementation entirely with a Rust workspace:

- `crates/ui-storm` renders HTML with [Maud](https://maud.lambda.xyz/). Components are props structs
  with builders and a pure `render() -> Markup`.
- `crates/ui-storm-web` is an Actix Web application serving the component gallery and documentation
  from the library itself.
- The stylesheet and a dependency-free enhancement script are compiled into the crate with
  `include_str!`, so there is no build step and no version skew between markup, CSS and script.
- The TypeScript code, its tooling and its tests were deleted, not archived. The git history holds
  them.

The 376 issues created for the TypeScript implementation remain in the tracker as historical
records. They are not being migrated: the new backlog (`backlog/issues.json`) is generated for the
Rust codebase, and issue numbers cannot be rewritten by this repository's automation.

## What survived, and why

| From the TypeScript era | Status |
| --- | --- |
| The accessibility-as-a-gate principle | Kept, and moved into the type system and tests |
| Logical-property CSS, RTL-first | Kept; still the only stylesheet, now with a test that forbids physical properties |
| The token and contrast model | Kept, and tightened: the palette is duplicated in Rust on purpose, and a test compares the two |
| Locale-to-direction resolution | Kept, with the same language and script tables and the same deliberate `ku` exception |
| Playwright and axe | Kept, retargeted at the gallery pages |
| Storybook | Dropped. The gallery is a real Actix app, so the documentation is a consumer of the library |
| Tailwind | Dropped. One hand-written stylesheet is smaller and can be audited line by line |
| React components | Rewritten as Maud templates |

## Consequences

- The library is server-rendered, so interactive behaviour is progressive enhancement, not a client
  runtime. This is a feature: content and controls work before any script runs.
- Consumers must serve two assets. They are small (about 17 kB CSS, 6 kB JavaScript unminified) and
  available as constants.
- The project can no longer claim "works with any React app". It can claim "renders HTML", which is
  a broader surface.
- Rust 1.82 is now the minimum supported version, and CI builds it.
- Contributors need Rust, not Node — though Node remains for the browser tests only.

## Alternatives considered

- **Keep both implementations.** Two codebases that must stay in feature parity, with half the
  contributors on each. Rejected as a maintenance trap.
- **Archive the React version in a subdirectory.** Keeps dead code in the tree and invites drive-by
  edits. Rejected; git history is the archive.
- **Askama or a hand-rolled template helper instead of Maud.** Both are viable. Maud's compile-time
  checking of element and attribute structure is worth the macro, and a template file would have
  separated the props struct from the markup it must satisfy.
- **A client-side Rust framework (Leptos, Dioxus, Yew).** They would have reproduced the hydration
  and bundle problems of the React version with a smaller ecosystem.
