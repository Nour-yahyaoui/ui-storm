# Components

This folder is intentionally empty at foundation stage.

Component work is tracked as individual GitHub issues (see the milestones on the
repository) and lands one issue at a time, each with:

- an implementation that follows the WAI-ARIA Authoring Practices pattern it declares
- unit tests in `*.test.tsx` using `render` from `src/test-utils/render.tsx`
- an axe assertion via `expectNoA11yViolations`
- stories covering LTR, RTL, dark mode, and every state
- a Playwright spec for keyboard and screen-reader-relevant behaviour
- a changeset and a docs page

Order of implementation is defined by the milestone `01 · Core primitives`:
`Button` → `IconButton` → `Link` → `Text` → `Heading` → `VisuallyHidden` → `Spinner`.
