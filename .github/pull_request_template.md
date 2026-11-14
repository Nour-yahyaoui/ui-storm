## What changed

<!-- One or two sentences. Link the issue: "Closes #123". -->

## Why

<!-- The problem this solves. If it is a behaviour change, say what used to happen. -->

## Accessibility impact

<!--
Every change has one. Delete what does not apply.
-->

- [ ] Names, roles and relationships: unchanged / checked, because …
- [ ] Keyboard: reachable, operable, focus visible, no new focus trap
- [ ] Direction: logical properties only, checked with `?lang=ar`
- [ ] Contrast: no colour outside the tokens, audit passes in both themes
- [ ] No-JavaScript behaviour: still readable and operable
- [ ] Motion: nothing depends on animation, reduced-motion honoured

## Checks

- [ ] `cargo fmt --all -- --check`
- [ ] `cargo clippy --workspace --all-targets -- --deny warnings`
- [ ] `cargo test --workspace`
- [ ] `npx playwright test`
- [ ] `python3 scripts/build_backlog.py --check`

## Screenshots or markup

<!-- Before and after, in both directions if the layout changed. -->
