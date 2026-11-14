# 1. Accessibility is a build gate

- Status: accepted
- Date: 2026-11-08

## Context

Component libraries usually document accessibility instead of enforcing it. The documentation says
"every component is keyboard accessible"; the code has a `div` with `role="button"` and no key
handler. Reviews catch some of it, audits catch the rest months later, and the fix is a rewrite of
the component's public API.

We had a choice between three levels of enforcement:

1. **Document it.** Cheap, and decays immediately.
2. **Test it in the consuming application.** Real, but too late: the library has already shipped.
3. **Make the broken version unrepresentable, and test what remains.** More design work up front,
   and the only option that holds over time.

## Decision

Accessibility requirements are expressed in the type system where possible, and in tests
everywhere else.

- Names are constructor arguments, not optional props. `Input::new(id, label, name)` has no variant
  without a label; `IconButton::new(label, glyph)` has no variant without a name.
- Contrast ratios are computed from the shipped stylesheet in a unit test, with WCAG 2.2 thresholds
  per pair. A failing pair fails the build with the measured ratio in the message.
- The stylesheet may not contain physical CSS properties; a test fails on `left`, `right`,
  `margin-left` and friends.
- Every gallery page is run through axe in two themes and two directions, plus keyboard and
  no-JavaScript runs in Playwright.

## Consequences

- A contributor cannot ship an unlabelled control even if they never read the accessibility
  statement.
- Changing a colour requires updating the audit, which requires a passing ratio. This is slower than
  editing a hex value, and that is the intent.
- Some patterns become impossible to express: a `div` that behaves like a button, a tooltip as the
  only source of a name, a custom select that reimplements the native one badly.
- The tests are part of the public contract. Weakening one is a decision that needs an ADR, not a
  quick fix.

## Alternatives considered

- **A lint over the source.** Useful as a supplement, but a lint only sees code, and most
  accessibility failures are about relationships between elements that only exist after rendering.
- **Documentation plus review checklists.** Rejected: it is exactly the failure mode this project
  exists to replace.
