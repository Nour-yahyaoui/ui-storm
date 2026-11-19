# Changelog

All notable changes are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Rust workspace: `ui-storm` (library) and `ui-storm-web` (gallery).
- Components rendered with Maud: `Button`, `IconButton`, `Input`, `Checkbox`, `Dialog`, `Tabs`.
- `direction::locale_direction` — BCP-47 tag to writing direction, with RTL language and script
  tables and a deliberate LTR exception for Kurdish (Latin).
- `tokens` — the palette as Rust data, WCAG 2.2 contrast maths, and tests that compare the Rust
  palette against the shipped stylesheet and forbid physical CSS properties.
- `assets::CSS` and `assets::SCRIPT` — the stylesheet and the enhancement script compiled into the
  crate.
- Gallery served by Actix Web: overview, foundations with measured contrast ratios, six component
  pages, accessibility policy, and a full Arabic RTL page. Language and theme are query parameters
  and are resolved on the server.
- Test suites: markup contracts per component, HTTP contracts per page, Playwright axe runs across
  two themes and two directions, keyboard and no-JavaScript runs.
- Generated backlog of 332 issues across 13 milestones (`scripts/build_backlog.py`, `docs/backlog.md`).
- `bidi-kit` (`packages/bidi-kit`) — an npm package for mixed-direction text: run segmentation,
  direction detection, `<bdi>`/isolate helpers, HTML paragraph building, Arabic font stacks and
  `@font-face` rules, logical-CSS tokens, bidi control-character stripping, an `audit` lint, a CLI,
  and a demo page with naive-versus-fixed comparisons. Zero runtime dependencies; ESM, CommonJS and
  type declarations; verified in CI and by `npm test`. See `docs/bidi-kit.md` and
  `docs/adr/0004-bidi-kit-npm-package.md`.

- `bidi-kit` ships a single-file browser build, `dist/bidi-kit.global.js`: one classic `<script src>`
  that sets `window.bidiKit`, for pages with no bundler, no module loader and no server. It is
  generated from `dist/esm` by `scripts/build-global.mjs` (dependency order, no re-indentation, a
  hard error on duplicate top-level names) and held to the module build's behaviour by
  `tests/global.test.mjs`. `unpkg` and `jsdelivr` fields point at it, and `demo/plain.html` is a
  worked example that also works from `file://`.

- `static/bidi-kit.js` — the committed copy of the single-file build, so a static
  page can load it from a CDN in front of the repository without npm:
  `https://cdn.jsdelivr.net/gh/Nour-yahyaoui/ui-storm@main/static/bidi-kit.js`. Written by
  `npm run static:sync`, checked in CI and before publishing by `npm run static:check`.
- `site/index.html` — the project landing page: what ui-storm is, what bidi-kit decides, how to use
  the script from a static page, and the founder. One self-contained file; it loads bidi-kit from the
  repository-backed CDN and falls back to a local copy.

### Fixed

- `bidi-kit` builds and tests on Windows. The build now runs
  `node_modules/typescript/bin/tsc` with the current Node binary instead of the `.bin/tsc` shim,
  which is a `.cmd` file on Windows and cannot be spawned without a shell; test discovery hands the
  glob to `node --test` rather than relying on the shell to expand it; and `npm run pack:check`
  replaces the shell one-liner that verified the tarball. A `bidi-kit on Windows` CI job now runs
  the suite on `windows-latest`.

### Changed

- The project is rebuilt in Rust. The React/TypeScript implementation, Storybook, Vite, Vitest and
  Tailwind have been removed; see `docs/adr/0002-rust-rewrite.md`.
- Class prefix changed from `aui-` to `ui-`.
- Documentation is the gallery application, not a set of MDX stories.

### Removed

- `src/`, the React tests, Storybook configuration, ESLint/Prettier configuration, and the npm build
  and lint scripts.

## Historical

The 0.x TypeScript releases were not published to any registry. Their record is the git history and
the 376 issues still open in the tracker.
