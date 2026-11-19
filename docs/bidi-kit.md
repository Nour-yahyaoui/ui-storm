# Inline direction: `bidi-kit`

[`docs/direction.md`](direction.md) covers the direction of a **page**: a locale becomes a
`Direction`, the layout writes it to `<html dir>`, and the stylesheet uses logical properties. This
page covers the direction of a **sentence**, which is a different problem with a different shape.

The package lives in [`packages/bidi-kit`](../packages/bidi-kit/README.md) and on npm as `bidi-kit`.

## The problem in one paragraph

`dir="rtl"` sets the base direction of a block. Everything inside it is then ordered by the Unicode
bidi algorithm, which works per character and is correct in isolation — and surprising in bulk,
because punctuation and digits are *neutral*: they take their direction from their neighbours. So an
English full stop after an Arabic name moves to the wrong side of the name, a phone number inside an
Arabic sentence is chopped into pieces that reassemble out of order, and a French quotation inside an
Arabic paragraph reads backwards. The algorithm cannot know where the author meant a boundary to be.
An isolate (`<bdi>`, or `U+2066`–`U+2069` in plain text) says "this is a complete unit" — provided
somebody gets the boundaries right. That is the whole job.

## What the package decides

| Question | Function |
| --- | --- |
| Which way is this string? | `detectDirection` (`dir="auto"` semantics), `resolveDirection` (never neutral) |
| Where does each run start and end? | `segments(text, base?)` |
| How do I keep a run from leaking? | `bdi()`, `paragraph()`, `isolate()`, `isolateRunsText()` |
| Which face has the glyphs? | `FONT_STACKS`, `fontStack(locale)`, `fontFace()`, `ARABIC_FEATURES` |
| What CSS stops it recurring? | `CSS`, `ROOT_CSS` |
| Is this content safe to render? | `stripBidiControls()`, `audit()` |
| Can I use it from a plain HTML file? | `<script src="dist/bidi-kit.global.js">` → `window.bidiKit`, no modules and no bundler |
| Can a static page load it without npm? | `<script src="https://cdn.jsdelivr.net/gh/Nour-yahyaoui/ui-storm@main/static/bidi-kit.js">`, kept in sync by `npm run static:sync` and checked in CI |

It does not implement the bidi algorithm, shape Arabic, or ship fonts. Those belong to the browser or
to the consumer's licence decision.

## Working on it

```bash
cd packages/bidi-kit
npm ci
npm test
npm run demo
npm run pack:check
npx bidi-kit check some-page.html
```

`npm test` builds ESM and CJS and then runs `node --test`. `npm run demo` serves the demo page on
port 4173. `npm run pack:check` builds and then verifies the published tarball: both module formats,
the declarations, the CLI, the README and the licence present; sources and dependencies absent.

CI runs those steps on Linux in the `bidi-kit` job, and again on `windows-latest` in the
`bidi-kit on Windows` job — the latter exists because the build once invoked the `.bin/tsc` shim,
which is a `.cmd` file on Windows and cannot be spawned, and because a shell one-liner in the workflow
was not portable either.

## Why it is not part of the Rust crates

Recorded in [`docs/adr/0004-bidi-kit-npm-package.md`](adr/0004-bidi-kit-npm-package.md). The short
version: inline direction is asked at render time by JavaScript in frameworks this repository does
not control, and the fix has to be one `npm install` away. The two implementations share a point of
view, not code.
