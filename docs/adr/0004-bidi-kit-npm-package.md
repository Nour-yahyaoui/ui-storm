# 4. Ship mixed-direction text handling as a standalone npm package

- Status: accepted
- Date: 2026-11-14

## Context

The Rust library answers "which way does this *page* go": `locale_direction` turns a BCP-47 tag into
a `Direction`, every page writes it to `<html dir>`, and the stylesheet uses logical properties only.
That is the right answer for a page and the wrong answer for a *sentence*.

A sentence mixes directions. An English support ticket contains an Arabic name; an Arabic invoice
quotes a French company; a Tunisian address mixes both with a phone number. In those strings the hard
question is not the block direction — browsers and the Rust layout settle that — it is where each
run *ends*, which characters belong inside it, and which face has the glyphs. Those questions are
asked by JavaScript on the client, at render time, in frameworks this repository does not control.

Two constraints shaped the answer:

1. **The consumers are not Rust users.** React, Vue, Svelte, plain HTML, a terminal, a CLI that
   checks a translation file — the fix has to be installable with `npm install` and usable in one
   line.
2. **The failure is invisible in review.** Nothing in a diff shows that a full stop is on the wrong
   side, or that `U+202E` is hiding a second string. Whatever ships has to be testable, and has to
   name the failure modes out loud.

## Decision

Add `packages/bidi-kit`, a standalone npm package in this repository with no shared build with the
Rust crates and no runtime dependencies:

- TypeScript source compiled to ESM (`dist/esm`) and CommonJS (`dist/cjs`), with declarations, so it
  works in Node, bundlers, and a `<script type="module">` with no build step.
- The library works out **run boundaries**, **direction**, **isolation** and **font tokens**. It does
  not reimplement the Unicode bidi algorithm: browsers do that correctly, and a second opinion would
  only disagree with them.
- Isolation uses `<bdi>` and `U+2066`–`U+2069`, never the deprecated `RLE`/`LRE`/`PDF` embeddings,
  which leak surrounding direction into the run.
- Fonts are stacks and `@font-face` *rules*, not bytes. Choosing a face is a licence and subsetting
  decision that belongs to the consumer.
- `stripBidiControls()` and `audit()` treat invisible control characters as a security problem, not
  a typographic one.
- A demo page serves as the acceptance criterion: five naive-versus-fixed comparisons and a
  playground that runs the real build.

## Consequences

- The repository now has two toolchains. `npm ci && npm test` in `packages/bidi-kit` is a CI job, and
  the Rust jobs never build the package.
- The Rust crates and the package share a point of view but no code. `docs/direction.md` describes
  page direction; `packages/bidi-kit/README.md` describes inline direction. Where they overlap, the
  rules are stated once in each place with the same reasoning.
- Publishing is manual and deliberate: `npm publish` from `packages/bidi-kit`, after `npm test` and
  `npm pack --dry-run`. CI verifies the tarball contains the builds, the binary, the README and the
  licence, and no sources.
