#!/usr/bin/env node
/**
 * Assembles the standalone `bidi-kit` repository from this monorepo.
 *
 * The npm package and the Rust crate live here because they are one project and
 * were written together. They belong in their own repository because they are
 * published separately, versioned separately, and consumed by people who have
 * never heard of ui-storm — and a package whose README says "clone the monorepo
 * and look in packages/bidi-kit" is a package with a tax on it.
 *
 * This script is the move. It copies, rewrites the paths that only make sense in
 * a monorepo, and refuses to run rather than produce a tree with a dangling
 * reference in it: every rewrite asserts that the string it is looking for is
 * actually there. If a file changes shape, this fails loudly instead of writing
 * a repository that builds here and breaks there.
 *
 *   node tools/standalone.mjs --out ../bidi-kit
 *   node tools/standalone.mjs --out ../bidi-kit --force     # overwrite
 *   node tools/standalone.mjs --out ../bidi-kit --no-git    # skip git init
 *
 * What it does *not* do: push, publish, or delete anything from this repository.
 * Removing the copies here is a separate, later step — a page cannot load a file
 * from a repository that does not exist yet.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const REPOSITORY = "https://github.com/Nour-yahyaoui/bidi-kit";
const OLD = "https://github.com/Nour-yahyaoui/ui-storm";

const args = process.argv.slice(2);
const outFlag = args.indexOf("--out");
const out = resolve(outFlag === -1 ? join(root, "..", "bidi-kit") : args[outFlag + 1]);
const force = args.includes("--force");
const initGit = !args.includes("--no-git");
let gitInitialised = false;

const copied = [];
const rewritten = [];

function copy(from, to) {
  const source = join(root, from);
  if (!existsSync(source)) throw new Error(`missing in this repository: ${from}`);
  const destination = join(out, to ?? from);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
  copied.push(to ?? from);
}

function write(path, contents) {
  const destination = join(out, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
  copied.push(path);
}

function rewrite(path, replacements) {
  const file = join(out, path);
  let text = readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    const found =
      typeof from === "string" ? text.includes(from) : text.match(from) !== null;
    if (!found) {
      throw new Error(
        `${path}: expected to find ${JSON.stringify(String(from))} — the file changed shape, ` +
          "so this script's rewrite is stale. Fix the rewrite, do not force past it.",
      );
    }
    text = typeof from === "string" ? text.split(from).join(to) : text.replace(from, to);
  }
  writeFileSync(file, text);
  rewritten.push(path);
}

if (existsSync(out) && readdirSync(out).length > 0) {
  if (!force) {
    throw new Error(`${out} is not empty. Move it aside, or pass --force to replace it.`);
  }
  for (const entry of readdirSync(out)) rmSync(join(out, entry), { recursive: true, force: true });
}
mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- the package
// The npm package becomes the root of the repository: `npm publish` from the
// top of a repo, `https://github.com/owner/bidi-kit` in the README, one clone
// per thing installed.
for (const entry of ["src", "bin", "scripts", "tests", "demo"]) {
  copy(`packages/bidi-kit/${entry}`, entry);
}
for (const file of [
  "package.json",
  "package-lock.json",
  "tsconfig.base.json",
  "tsconfig.esm.json",
  "tsconfig.cjs.json",
  "README.md",
  "LICENSE",
]) {
  copy(`packages/bidi-kit/${file}`, file);
}
copy("static/bidi-kit.js");

// ----------------------------------------------------------------- the crate
copy("crates/bidi-kit");

// -------------------------------------------------------------- the generators
copy("tools/gen-unicode-tables.mjs");
copy("tools/gen-corpus.mjs");
copy("tools/standalone/ci.yml", ".github/workflows/ci.yml");
copy("docs/dioxus.md");

const version = JSON.parse(readFileSync(join(out, "package.json"), "utf8")).version;

// ---------------------------------------------------------------- the rewrites

// The package sits at the repository root now, so `../..` is no longer the
// repository — `..` from the build output was, and the root is the root.
rewrite("scripts/sync-static.mjs", [
  ['const repository = join(root, "..", "..");', "const repository = root;"],
  ["`@main/packages/bidi-kit/static/bidi-kit.js`", "`@main/static/bidi-kit.js`"],
]);

// The banner inside every build names the repository it came from.
rewrite("scripts/build-global.mjs", [[OLD, REPOSITORY]]);
rewrite("static/bidi-kit.js", [[OLD, REPOSITORY]]);

rewrite("scripts/build.mjs", [
  [
    '"TypeScript is not installed. Run `npm install` (or `npm ci`) in packages/bidi-kit first."',
    '"TypeScript is not installed. Run `npm install` (or `npm ci`) first."',
  ],
]);

// The README's CDN examples: the GitHub-backed URL moves with the repository, the
// npm-backed one is version-pinned and must match what is actually published.
rewrite("README.md", [
  [
    `<script src="https://cdn.jsdelivr.net/gh/Nour-yahyaoui/ui-storm@main/static/bidi-kit.js"></script>`,
    `<script src="https://cdn.jsdelivr.net/gh/Nour-yahyaoui/bidi-kit@main/static/bidi-kit.js"></script>`,
  ],
  [/\bbidi-kit@\d+\.\d+\.\d+/g, `bidi-kit@${version}`],
  [
    "There is a worked example of the first option:\n" +
      "[`demo/plain.html`](demo/plain.html) — one script tag, no modules, no build. The project landing page\n" +
      "at [`site/index.html`](../../site/index.html) is a second one, and it loads the script from the\n" +
      "repository-backed CDN described above, with a local fallback.",
    "There is a worked example of the first option:\n" +
      "[`demo/plain.html`](demo/plain.html) — one script tag, no modules, no build. The landing page is\n" +
      "[`demo/index.html`](demo/index.html), which loads the script from the repository-backed CDN\n" +
      "described above, with a local fallback.",
  ],
]);

// The corpus lives beside the tests it belongs to, at the repository root.
rewrite("tools/gen-corpus.mjs", [
  ['"../packages/bidi-kit/dist/esm/index.js"', '"../dist/esm/index.js"'],
  [
    '"packages/bidi-kit/tests/corpus.json is stale; run node tools/gen-corpus.mjs"',
    '"tests/corpus.json is stale; run node tools/gen-corpus.mjs"',
  ],
  [
    'new URL("../packages/bidi-kit/tests/corpus.json", import.meta.url)',
    'new URL("../tests/corpus.json", import.meta.url)',
  ],
]);

rewrite("crates/bidi-kit/tests/corpus.rs", [
  [
    "//! `packages/bidi-kit/tests/corpus.json` is generated from the JavaScript",
    "//! `tests/corpus.json` is generated from the JavaScript",
  ],
  [
    `    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("bidi-kit")
        .join("tests")
        .join("corpus.json");`,
    `    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("tests")
        .join("corpus.json");`,
  ],
]);

rewrite("crates/bidi-kit/README.md", [
  ["`packages/bidi-kit/tests/corpus.json`", "`tests/corpus.json`"],
  [
    "`packages/bidi-kit/tests/corpus.test.mjs` and `crates/bidi-kit/tests/corpus.rs`\nread it.",
    "`tests/corpus.test.mjs` and `crates/bidi-kit/tests/corpus.rs` read it.",
  ],
]);

rewrite("tools/gen-unicode-tables.mjs", [
  ["exactly as `packages/bidi-kit` does", "exactly as the JavaScript package does"],
]);

// The demo page's footer tells people where to run the demo. In the monorepo that
// is a directory three levels up; here it is the directory they are in.
rewrite("demo/index.html", [
  [
    "<code class=\"inline\">$ npm run demo</code> in\n    <code class=\"inline\">packages/bidi-kit</code>.",
    "<code class=\"inline\">$ npm run demo</code> in this repository.",
  ],
]);

// The guide stops being a chapter of ui-storm and becomes this repository's own
// documentation: it cannot link to a file in a repository it is no longer in, and
// the locale example has to stop naming a crate that is not a dependency.
rewrite("docs/dioxus.md", [
  [
    "[`docs/bidi-kit.md`](bidi-kit.md) covers the npm package",
    "[`README.md`](../README.md) covers the npm package",
  ],
  ["`packages/bidi-kit/tests/corpus.test.mjs`", "`tests/corpus.test.mjs`"],
  ["# packages/bidi-kit/tests/corpus.json", "# tests/corpus.json"],
  [
    "A page has a direction before it has sentences. `ui-storm` resolves it from the\n" +
      "locale — `direction::locale_direction(\"ar-EG\")` is `Direction::Rtl` — and writes\n" +
      "it to `<html dir>`. Inside that page, every paragraph inherits:",
    "A page has a direction before it has sentences. Something on the request path\n" +
      "resolves it once — a BCP-47 tag to a `Direction` — and writes it to `<html dir>`\n" +
      "for the whole document. Inside that page, every paragraph inherits:",
  ],
  [
    "let base = ui_storm::direction::locale_direction(locale);",
    "let base = locale_direction(locale); // your own BCP-47 tag to Direction",
  ],
]);

// ------------------------------------------------------- files that only exist
//                                                          in a standalone repo
write(
  "Cargo.toml",
  `[workspace]
members = ["crates/bidi-kit"]
resolver = "2"

[workspace.package]
version = "${version}"
edition = "2021"
license = "MIT"
rust-version = "1.82"
authors = ["Nour Yahyaoui"]
repository = "${REPOSITORY}"

[profile.release]
lto = "thin"
codegen-units = 1
`,
);

const pkg = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
pkg.repository = { type: "git", url: `${REPOSITORY}.git` };
pkg.homepage = `${REPOSITORY}#readme`;
pkg.bugs = { url: `${REPOSITORY}/issues` };
writeFileSync(join(out, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
rewritten.push("package.json");

write(
  ".gitignore",
  `# Build outputs
dist/
target/
node_modules/
*.tgz

# Editors and platforms
.DS_Store
Thumbs.db
.idea/
.vscode/
`,
);

write(
  ".gitattributes",
  `# The committed CDN copy is compared byte for byte with a fresh build, so it
# must not be rewritten by a Windows checkout's autocrlf.
static/bidi-kit.js text eol=lf
`,
);

write(
  "CHANGELOG.md",
  `# Changelog

All notable changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

History before this repository existed — the commits that wrote the package — is
in [ui-storm](https://github.com/Nour-yahyaoui/ui-storm), under
\`packages/bidi-kit\`.

## [Unreleased]

### Added

- \`crates/bidi-kit\` — the segmentation decisions in Rust: \`segments\`,
  \`detect_direction\`, \`resolve_direction\`, \`isolate\`, \`strip_bidi_controls\`, and the
  \`<bdi>\` / \`<p>\` builders, so a server-rendered page decides direction before the
  HTML exists instead of correcting it after hydration.
- An optional \`dioxus\` feature with a \`MixedText\` component that renders one
  \`<bdi>\` per run, and \`docs/dioxus.md\` explaining why the JavaScript bundle is the
  wrong shape for a Rust renderer.
- \`tests/corpus.json\` — shared fixtures generated from the JavaScript and read by
  both suites, plus \`tools/gen-corpus.mjs\` and \`tools/gen-unicode-tables.mjs\` with
  \`--check\` modes, so the port is verified against behaviour instead of against a
  description of it.

## [0.1.1]

### Added

- \`dist/bidi-kit.global.js\` in the published tarball: one file, 31 exports, no
  bundler, for a page with a \`<script>\` tag and nothing else.
- \`unpkg\` and \`jsdelivr\` fields, so \`https://unpkg.com/bidi-kit\` resolves to it.

### Changed

- \`prepublishOnly\` is \`npm test\`. It used to run the static-copy drift check,
  which made every release impossible: the version bump makes the committed copy
  stale, so the guard refused to publish until you committed — a commit demanded
  in the middle of a publish. The check stays in CI.

## [0.1.0]

### Added

- \`segments\`, \`detectDirection\`, \`resolveDirection\` — where a sentence changes
  direction, and which way it goes.
- \`bdi\`, \`inline\`, \`paragraph\`, \`isolate\`, \`isolateRunsText\` — isolation, never the
  deprecated embeddings.
- Arabic font stacks, joining features and \`@font-face\` rules.
- \`CSS\` and \`ROOT_CSS\` — the rules that stop the problem recurring.
- \`audit\`, \`formatAudit\`, \`stripBidiControls\` — invisible characters as a security
  problem.
- The \`bidi-kit\` CLI: \`check\`, \`runs\`, \`isolate\`, \`dir\`.
`,
);

write(
  "CONTRIBUTING.md",
  `# Contributing

## The two implementations

\`src/\` is the reference. \`crates/bidi-kit\` is a port, and it is only worth
something while it agrees with the reference. Two generated files keep them in
step, and both have a \`--check\` mode that CI runs:

\`\`\`bash
node tools/gen-corpus.mjs           # tests/corpus.json, from the JavaScript
node tools/gen-corpus.mjs --check
node tools/gen-unicode-tables.mjs   # crates/bidi-kit/src/tables.rs, from Node's \\p{…}
node tools/gen-unicode-tables.mjs --check
\`\`\`

If you change the segmenter, the corpus diff **is** the specification change. Read
it before committing it: a regenerated fixture is how a bug becomes a rule.

## Before a pull request

\`\`\`bash
npm ci
npm test
npm run pack:check
node scripts/sync-static.mjs --check
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- --deny warnings
cargo test --workspace --all-targets
cargo check --package bidi-kit --features dioxus
\`\`\`

On Windows, use \`npm\` scripts rather than a shell: no \`.bin/*.cmd\` calls, no
globs, no \`VAR=x\` prefixes. The Windows CI job exists because those broke a
release once.

## Two known defects

Both are "a neutral adjacent to a Latin run at a boundary", and both need a
fixture in the corpus plus a fix in both implementations:

- \`تقرير.pdf\` — the full stop detaches from the Latin extension and joins the
  Arabic run.
- \`A(0 ; 2)\` — a closing bracket at the end of a Latin run is separated from its
  coordinate and lands in the following Arabic run, where it is mirrored.

## Releasing

\`\`\`bash
npm pkg set version=0.1.2
npm run static:sync          # the committed CDN copy carries the version banner
git add -A && git commit -m "0.1.2"
git tag -a v0.1.2 -m "bidi-kit 0.1.2"
git push origin main v0.1.2
npm publish
\`\`\`

\`static:sync\` before publishing is not optional: the bundle stamps the version
into its banner, so a copy that was not regenerated still claims the old one.
`,
);

const readme = readFileSync(join(out, "README.md"), "utf8");
write(
  "README.md",
  `${readme.trimEnd()}

## The Rust crate

\`crates/bidi-kit\` makes the same decisions in Rust, from the same rules, before
the HTML exists — which is what a server-rendered page needs, and what a Dioxus
app needs if it is ever to hydrate without disagreeing with itself.

\`\`\`rust
use bidi_kit::{segments, Direction};

let runs = segments("Write to أحمد.", None);
assert_eq!(runs[1].dir, Direction::Rtl);
assert_eq!(runs[1].text, "أحمد");
\`\`\`

Two differences from the package, both deliberate: offsets are bytes rather than
UTF-16 indices, and \`detect_direction\` returns \`Option<Direction>\` rather than a
\`"neutral"\` string pretending to be a direction. The guide, including the Dioxus
SSR argument and the Maud route with no Dioxus at all, is
[\`docs/dioxus.md\`](docs/dioxus.md).

The two implementations are kept in step by a fixture file generated from the
JavaScript and read by both suites, and by character tables generated from Node's
own Unicode properties — so "the port agrees with the library" is a claim CI can
refute.

## Repository layout

\`\`\`
src/                    TypeScript sources: segment, isolate, html, fonts, css, audit
bin/bidi-kit.mjs        The CLI
scripts/                build, build-global, sync-static, check-tarball, serve
tests/                  Unit tests, and corpus.json shared with the Rust crate
static/bidi-kit.js      The committed bundle a CDN serves (npm run static:sync)
demo/                   A page with one script tag, and the demo page
crates/bidi-kit/        The Rust crate and its Dioxus component
tools/                  Generators for the corpus and the Unicode tables
docs/                   The Dioxus and Rust guide
\`\`\`

## Working on it

\`\`\`bash
npm ci
npm test                     # build, then the suite against the build
npm run static:sync          # regenerate the committed CDN copy
node tools/gen-corpus.mjs --check
cargo test --workspace       # the Rust crate, against the same corpus
\`\`\`

See [CONTRIBUTING.md](CONTRIBUTING.md).
`,
);

// --------------------------------------------------------------------- the git
if (initGit) {
  const git = (...args) => execFileSync("git", args, { cwd: out, encoding: "utf8" });
  if (!existsSync(join(out, ".git"))) git("init", "-b", "main");
  git("add", "-A");
  const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  try {
    git(
      "commit",
      "-m",
      `Import bidi-kit from ui-storm@${head}\n\n` +
        "The package and the Rust crate were written in the ui-storm monorepo, next to\n" +
        "the component library they belong to. They are published separately and\n" +
        "consumed by people who have never heard of ui-storm, so they move here, with\n" +
        "the paths rewritten: the package is the repository root, the crate stays at\n" +
        "crates/bidi-kit, and the shared corpus is at tests/corpus.json.\n\n" +
        "History before this commit is in the monorepo.",
    );
    gitInitialised = true;
  } catch (error) {
    // A machine with no `user.name` fails here, and that is a git setting, not a
    // problem with the repository: say so and leave the tree staged.
    console.warn("git init done, but the first commit failed:");
    console.warn(`  ${String(error.stderr ?? error.message).trim().split("\n").at(-1)}`);
    console.warn("  set user.name and user.email, then: git commit -m 'Import bidi-kit'");
  }
}

// ------------------------------------------------------------------- the report
console.log(`assembled ${out} — bidi-kit ${version}`);
console.log(`  ${copied.length} paths copied, ${rewritten.length} rewritten`);
if (initGit) {
  if (gitInitialised) console.log("  git initialised on `main` with one commit");
  console.log("");
  console.log("Next, on this machine:");
  console.log(`  cd ${out}`);
  console.log("  npm ci && npm test");
  console.log("  git remote add origin git@github.com:Nour-yahyaoui/bidi-kit.git");
  console.log("  git push -u origin main");
} else {
  console.log("  git skipped (--no-git)");
}
