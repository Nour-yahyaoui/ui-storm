# Moving `bidi-kit` into its own repository

The package and the Rust crate were written here because they belong to this
project. They are published separately and read by people who have never heard of
ui-storm — and a package whose README says "clone the monorepo and look in
`packages/bidi-kit`" is a package with a tax on it.

[`tools/standalone.mjs`](../tools/standalone.mjs) is the move: it assembles a
complete, working `bidi-kit` repository from this one, rewriting every path that
only makes sense inside a monorepo. It refuses to run if a file it expects to
rewrite has changed shape, so a stale script fails loudly instead of producing a
repository that builds here and breaks there.

## What moves where

| Here | There |
| --- | --- |
| `packages/bidi-kit/*` | the repository root — `src/`, `bin/`, `scripts/`, `tests/`, `demo/`, `package.json` |
| `crates/bidi-kit/` | `crates/bidi-kit/` (unchanged path, own workspace at the root) |
| `static/bidi-kit.js` | `static/bidi-kit.js` |
| `tools/gen-unicode-tables.mjs`, `tools/gen-corpus.mjs` | `tools/` |
| `docs/dioxus.md` | `docs/dioxus.md` |
| — | `Cargo.toml`, `CHANGELOG.md`, `CONTRIBUTING.md`, `.gitignore`, `.gitattributes`, `.github/workflows/ci.yml` |

The npm package becomes the **root** of the new repository: `npm publish` runs
from the top of a clone, and the GitHub URL in the README is the repository the
file is actually in.

## Doing it on your machine

From the monorepo, on `main` and up to date:

```powershell
cd C:\Users\HP\ui-storm
git checkout main
git pull

node tools\standalone.mjs --out C:\Users\HP\bidi-kit
```

It prints how many paths it copied and rewrote, then `git init`s the new
repository on `main` with one commit whose message names the ui-storm commit it
came from. If git has no identity configured, it says so and leaves the tree
staged — the repository is fine either way.

Build and test it before it goes anywhere:

```powershell
cd C:\Users\HP\bidi-kit
npm ci
npm test
npm run static:check
node tools\gen-corpus.mjs --check
node tools\gen-unicode-tables.mjs --check
```

That is the same set CI runs. `dist/` and `node_modules/` are not copied, which
is why `npm ci` comes first.

## Creating the repository

With the GitHub CLI, from inside the new tree:

```powershell
cd C:\Users\HP\bidi-kit
Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
gh repo create Nour-yahyaoui/bidi-kit --public --source . --remote origin --push
```

`Remove-Item Env:GITHUB_TOKEN` is there because a stale environment variable
overrides the stored credential and produces `HTTP 401: Bad credentials` — the
same trap that blocked the pull request for 0.1.1.

Without `gh`, create the repository empty on github.com and then:

```powershell
cd C:\Users\HP\bidi-kit
git remote add origin https://github.com/Nour-yahyaoui/bidi-kit.git
git push -u origin main
```

Then tag it. This is the tag that was impossible here: `main` in this monorepo
said 0.1.0 while npm said 0.1.1, so a `v0.1.1` tag would have labelled a 0.1.0
tree. In the new repository `package.json` says 0.1.1 and the tag has a commit
worth pointing at:

```powershell
git tag -a v0.1.1 -m "bidi-kit 0.1.1: the browser build, and the Rust crate"
git push origin v0.1.1
git ls-remote --tags origin
```

## What changes for people using it

**npm is unaffected.** `npm install bidi-kit` and
`cdn.jsdelivr.net/npm/bidi-kit@0.1.1/dist/bidi-kit.global.js` keep working; the
tarball is the same tarball. Nothing needs republishing — 0.1.1 is already on the
registry, and the new repository's `package.json` says 0.1.1.

**The GitHub-backed CDN URL gains a shorter home.** Both of these serve the same
file, and both keep working while the copy in this repository exists:

```
https://cdn.jsdelivr.net/gh/Nour-yahyaoui/bidi-kit@v0.1.1/static/bidi-kit.js    ← new, immutable
https://cdn.jsdelivr.net/gh/Nour-yahyaoui/ui-storm@main/static/bidi-kit.js     ← today
```

Pin the tag, not `@main`: jsDelivr caches branch URLs, and a cached branch URL
serves last week's bundle with this week's version number in its banner.

**The npm package's metadata changes.** `repository`, `homepage` and `bugs` in
`package.json` now name the new repository, so "Repository" on npmjs.com and the
link in the sidebar go to the right place. That metadata is baked into the
published 0.1.1 tarball and will not change until 0.1.2 — worth a release note.

## Cleaning up here, afterwards

Not part of the move, and not something to do first: a page cannot load a file
from a repository that does not exist yet. Once the new repository is public and
green, a second pull request here should:

1. Point `site/index.template.html` at the new CDN URL — the script tag in the
   "one tag" section, and the `@main` examples in the guide text.
2. Delete `packages/bidi-kit/`, `crates/bidi-kit/`, `tools/standalone.mjs` and
   `tools/standalone/`, and remove `crates/bidi-kit` from the workspace
   `Cargo.toml` members.
3. Decide what `static/bidi-kit.js` is now. It is the copy `site/build.mjs` inlines
   for the landing page; either keep it as a vendored copy pinned to a tag, with a
   comment saying so, or drop it and have the page load from the new repository's
   CDN with no local fallback.
4. Remove the `bidi-kit` and `bidi-kit on Windows` jobs from `.github/workflows/ci.yml`.
5. Note the move in `CHANGELOG.md` and in `docs/bidi-kit.md`, which should keep
   explaining the problem and link out for the implementation.

Until then this repository still contains a working copy, and the two are
identical — which is the reason to do the move in the same week rather than
eventually.
