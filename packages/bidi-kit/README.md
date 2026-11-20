# bidi-kit

Arabic words inside English sentences, French sentences inside Arabic paragraphs — with the
punctuation, numbers, quotation marks and fonts that go with them.

```ts
import { paragraph } from "bidi-kit";

const html = paragraph(
  ["The greeting is ", { text: "مرحبا", dir: "rtl", lang: "ar" }, "."],
  { lang: "en" },
);
// <p dir="ltr" lang="en">The greeting is <bdi dir="rtl" lang="ar">مرحبا</bdi>.</p>
```

Zero dependencies. No fonts bundled. TypeScript types, ESM, CommonJS **and a single-file classic
script for plain HTML pages**. Runs in the browser, in Node, in an edge worker; nothing in `dist`
imports `node:`.

## What it fixes

| Symptom | Cause | What bidi-kit does |
| --- | --- | --- |
| The full stop after an Arabic name renders on the wrong side | The stop is neutral, so it is absorbed into the Arabic run | `paragraph()` ends the run at the stop and isolates the Arabic |
| `+216 71 123 456` gets split and reordered inside Arabic | Digits are weak characters with no direction of their own | `segments()` keeps a number with its own punctuation as one left-to-right run |
| A French quotation inside an Arabic paragraph reads backwards | The quotation inherits the paragraph's direction | The run is isolated with `dir="ltr"`, or wrapped in `<bdi>` |
| Diacritics are clipped, or one word is rendered in two different faces | The Latin face has no Arabic glyphs, and the line-height is set for Latin | A system Arabic stack with raised line-height, from `FONT_STACKS` and `CSS` |
| `dir="auto"` guesses wrong on a number-led string | First-strong detection is a heuristic | `detectDirection()` is explicit, and testable |
| An invisible `U+202E` renames a file or a field | Bidi control characters are invisible by design | `stripBidiControls()` removes them; `audit()` reports them as errors |

## Install

```bash
npm install bidi-kit
```

Node 18 or newer for the CLI; the library itself has no engine requirement beyond ES2022.

## Use it without a build step

Three ways, depending on what your HTML file already is.

**1. A classic `<script>` tag** — no modules, no bundler, and it works when the page is opened by
double-clicking it:

```html
<script src="./bidi-kit/dist/bidi-kit.global.js"></script>
<script>
  const kit = window.bidiKit;
  document.querySelector("#line").innerHTML = kit.paragraph([
    "Sent to ",
    { text: "أحمد بن علي", dir: "rtl", lang: "ar" },
    " this morning.",
  ]);
</script>
```

`dist/bidi-kit.global.js` is 23 kB, sets `window.bidiKit`, and carries the same 31 exports as the
module build — `tests/global.test.mjs` runs both and compares their output string for string. This is
the file to copy into a static folder, a CMS "custom HTML" box, or a Jekyll/Hugo/WordPress template.

**2. `<script type="module">`** — the ES module build, no bundler, served over HTTP:

```html
<script type="module">
  import { paragraph, CSS, FONT_STACKS } from "./bidi-kit/dist/esm/index.js";

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
</script>
```

Modules will not load from `file://`, so this needs any static server (`python3 -m http.server`,
`npx serve`, your framework's dev server).

**3. Straight from this repository, through a CDN** — no npm account, no publish, works today:

```html
<script src="https://cdn.jsdelivr.net/gh/Nour-yahyaoui/ui-storm@main/static/bidi-kit.js"></script>
```

`static/bidi-kit.js` (at the root of the repository) is the committed copy of the bundle (`npm run static:sync` writes it; CI fails when
it drifts from the build). Pin `@main` to a tag or a commit hash for a URL that never changes.

Use the CDN, not `raw.githubusercontent.com`: raw GitHub answers with `text/plain` and `nosniff`, and
browsers refuse to execute a script served that way. A CDN in front of the same repository sends a
JavaScript content type, which is the entire difference.

**4. From the npm CDN** — nothing to install, once the package is published:

```html
<script src="https://cdn.jsdelivr.net/npm/bidi-kit@0.1.0/dist/bidi-kit.global.js"></script>

<script type="module">
  import { paragraph } from "https://cdn.jsdelivr.net/npm/bidi-kit@0.1.0/dist/esm/index.js";
</script>
```

The `unpkg` and `jsdelivr` fields in `package.json` point at the global build, so
`https://unpkg.com/bidi-kit` resolves to it directly.

**Whichever you choose**, two lines are still yours to write: put `lang` on `<html>`, and let user
text set its own direction with `dir="auto"` (or `kit.apply(element, text)`). Everything else is in
the package.

There is a worked example of the first option:
[`demo/plain.html`](demo/plain.html) — one script tag, no modules, no build. The project landing page
at [`site/index.html`](../../site/index.html) is a second one, and it loads the script from the
repository-backed CDN described above, with a local fallback.

## The four things you will actually call

### 1. `paragraph(parts, options)` — a paragraph built out of mixed runs

```ts
import { paragraph, FONT_STACKS } from "bidi-kit";

const html = paragraph(
  [
    { text: "قال المدير:", dir: "rtl", lang: "ar" },
    " ",
    { text: "« Bonjour à tous »", dir: "ltr", lang: "fr", font: FONT_STACKS.latin },
    " ",
    { text: "ثم غادر.", dir: "rtl", lang: "ar", font: FONT_STACKS.arabic },
  ],
  { lang: "ar" },
);
```

Each named part becomes a `<bdi>` with its own `dir`, `lang` and, if you pass one, font. Strings
are escaped; pass `{ html: true }` only for markup you have already sanitised.

### 2. `segments(text, base?)` — where the runs are

```ts
import { segments } from "bidi-kit";

segments("Write to أحمد.");
// [ { text: "Write to ", dir: "ltr",  start: 0,  end: 9  },
//   { text: "أحمد",      dir: "rtl",  start: 9,  end: 13 },
//   { text: ".",         dir: "ltr",  start: 13, end: 14 } ]
```

`base` is the paragraph direction. Omit it and the first strong character decides, which is what
the browser would assume anyway.

### 3. `bdi(text, options)` and `apply(el, text)` — the small ones

```ts
import { bdi, apply } from "bidi-kit";

bdi("أحمد", { lang: "ar" });            // <bdi lang="ar">أحمد</bdi>
apply(document.querySelector("#name"), "أحمد"); // textContent + dir="rtl"
```

### 4. `CSS` and `ROOT_CSS` — the rules that stop it happening again

```ts
import { CSS, ROOT_CSS, ARABIC_FEATURES } from "bidi-kit";

const style = document.createElement("style");
style.textContent = CSS + ROOT_CSS;
document.head.append(style);
```

`CSS` isolates every `[dir]`/`[lang]` element, aligns by direction rather than by side, gives
Arabic blocks a line-height that leaves room for the marks, and switches `[lang^="ar"]` to a face
that has the glyphs. `ROOT_CSS` puts `unicode-bidi: plaintext` on `html`, so a page that forgets
`dir` on one container still behaves.

## API

### Direction

| Function | Returns | Notes |
| --- | --- | --- |
| `detectDirection(text)` | `"ltr" \| "rtl" \| "neutral"` | First strong character, exactly what `dir="auto"` means |
| `resolveDirection(text)` | `"ltr" \| "rtl"` | Never neutral; safe to write to an attribute |
| `hasRtl(text)` | `boolean` | Any character of an RTL script |
| `hasArabic(text)` | `boolean` | Arabic *letters*; Arabic-Indic digits do not count |
| `isRtlCodePoint(cp)` | `boolean` | Script table, `U+0590`–`U+08FF` and the presentational blocks |

### Runs

`segments(text, base?)` returns `{ text, dir, start, end }[]`, with `start`/`end` as UTF-16
indices into the original string.

The rules, in one place:

- a strong character starts a run and decides its direction;
- Arabic-Indic digits and Arabic punctuation (`,`, `;`, `?`, `%`) stay inside an Arabic run, so
  `مرحبا،` does not break in half;
- Latin digits read left to right even inside Arabic, and `.` `,` `+` `-` `%` travel with the
  number they belong to, so `1,248.50%` stays one run;
- brackets, quotes and symbols are neutral: they take the direction of the runs on both sides
  when those agree, and otherwise the base direction — which is why an English full stop after
  an Arabic name stays in the English sentence;
- combining marks and invisible controls never split a run.

### Plain text

| Function | Use |
| --- | --- |
| `isolate(text, { dir })` | `FSI…PDI` (or `RLI`/`LRI`) around the whole string, for `aria-label`, canvas, terminals, CSV |
| `isolateRunsText(text)` | Every run isolated individually, for plain-text output |
| `stripBidiControls(text)` | Removes `U+061C`, `U+200E`, `U+200F`, `U+202A`–`U+202E`, `U+2066`–`U+2069` |
| `hasBidiControls(text)` | True when any of the above is present |
| `LRI`, `RLI`, `FSI`, `PDI`, `BIDI_CONTROL_CHARACTERS` | The constants, exported |

### HTML

| Function | Emits |
| --- | --- |
| `bdi(text, opts)` | `<bdi>` with optional `dir`, `lang`, `class`, inline `font-family` |
| `inline(text, opts)` | `<span dir="auto">`; pass `element: "bdi"` for the other one |
| `paragraph(parts, opts)` | `<p>` with a resolved `dir`, `lang`, and one `<bdi>` per named part |
| `escapeHtml(text)` | Escapes `& < > " '` |
| `apply(el, text, opts)` | Sets `textContent` and `dir` on an element-shaped object |

`inline` and `bdi` never trust their input; `paragraph` escapes strings unless `{ html: true }`.

### Fonts

| Export | What it is |
| --- | --- |
| `FONT_STACKS` | `arabic`, `hebrew`, `latin` stacks made of system faces |
| `fontStack(locale)` | Stack for a BCP-47 tag; `ar`, `fa`, `ur`, `ps` get Arabic |
| `ARABIC_FEATURES` | `"kern" 1, "liga" 1, "calt" 1, "rlig" 1, "init" 1, "medi" 1, "fina" 1` |
| `UNICODE_RANGES` | `unicode-range` per script, so a downloaded face is fetched only when needed |
| `fontFace(opts)` | An `@font-face` block with the range, weight and `font-display` filled in |
| `fontFamilyRule(selector, script)` | A one-line declaration block |

The Arabic stack is `"Noto Naskh Arabic", "Noto Sans Arabic", "Amiri", "Scheherazade New",
"Geeza Pro", "Segoe UI", "Noto Sans", sans-serif`. It starts with a naskh text face because that
is what Arabic prose is set in — and because a face without the glyphs makes the browser fall back
per glyph, which is what "one word, two fonts" looks like.

### Audit

```ts
import { audit, formatAudit } from "bidi-kit";

audit('<span dir="rtl">مرحبا</span>');
// [{ rule: "inline-direction-without-isolation", severity: "warning", index: 0, … }]
```

Rules: `bidi-control-character` (error), `inline-direction-without-isolation`,
`physical-text-align`, `physical-css-property`, `document-without-lang`. It is a lint, not a
proof.

## CLI

```bash
npx bidi-kit check page.html     # exits 1 when a bidi control character is found
npx bidi-kit runs note.txt       # prints each run and its direction
npx bidi-kit isolate note.txt
npx bidi-kit dir article.txt
```

With no file, every command reads standard input:

```bash
printf 'مرحبا، هذا نص.' | npx bidi-kit dir
```

None of these examples carry trailing comments, deliberately: `cmd.exe` on Windows would pass the
`#` and the words after it to the command as arguments.

## Why not just `dir="rtl"`?

Because a paragraph is not one direction. `dir` sets the base direction of the *block*, and the
Unicode bidi algorithm then decides the order of everything inside it — invisibly, per character,
using rules that are right in isolation and surprising in bulk. The two things the algorithm cannot
know are:

1. **Where the author meant a boundary.** Punctuation and digits are neutral; their direction is
   inherited. That is why a full stop after an Arabic name lands on the wrong side, and why a phone
   number inside Arabic gets chopped into pieces that reassemble in the wrong order.
2. **Which script owns a stray character.** `(`, `"`, `«` and `-` are shared, and mirroring only
   works when the pairing is inside the same directional run.

An isolate (`<bdi>`, `U+2066`–`U+2069`) tells the algorithm "this is a complete unit, resolve it
internally" — which fixes both, provided the unit boundaries are right. That is the whole job of
this package: finding the boundaries, then using the mechanism the standard already has.

The old answer was `RLE … PDF` and `LRE … PDF`. Those are *embeddings*, which leak the surrounding
direction into the run and are deprecated in CSS for exactly that reason. bidi-kit never emits them.

## Security: the invisible characters

Overrides and isolates are the raw material of display spoofing: `U+202E` reverses everything after
it, so `invoice\u202Efdp.exe` is displayed as `invoiceexe.pdf`. The same trick hides text in a code
review, a pull request diff, a filename, or a form field.

```ts
import { stripBidiControls, audit } from "bidi-kit";

const safe = stripBidiControls(untrusted);  // before storing, logging or rendering
audit(untrusted);                           // reports it as an error instead
```

`stripBidiControls` removes `U+061C`, `U+200E`, `U+200F`, `U+202A`–`U+202E` and `U+2066`–`U+2069`
and touches nothing else.

## What it does not do

- **It does not implement the Unicode bidi algorithm.** Browsers do that correctly; a second
  implementation would only disagree with them. bidi-kit works out boundaries and isolation.
- **It does not shape Arabic**, and it does not join letters. That is the renderer's job.
- **It does not ship fonts.** `fontFace()` writes the rule; you choose the bytes, so the licence
  and the subsetting stay your decision.
- **It does not do line breaking.** A wrapped RTL paragraph is still the browser's business;
  the `unicode-bidi: plaintext` in `ROOT_CSS` is the only help that is safe to give.

## Demo

```bash
npm run build
npm run demo
```

The demo is served on <http://localhost:4173>. `npm run demo` builds first if `dist` is missing.

The demo page shows five side-by-side comparisons — naive `textContent` versus bidi-kit — for an
English sentence ending in Arabic, an Arabic paragraph quoting French, numbers and an email in
Arabic, a French paragraph with an Arabic name, and Arabic with full tashkeel. Below them is a
playground that runs the real library on your own text and prints the runs it found.

## Tests

```bash
npm ci
npm test
npm run pack:check
```

`npm test` builds ESM and CJS, then runs `node --test`. `npm run pack:check` builds and then asserts
what `npm publish` would upload — both module formats, the declarations, the CLI, the README and the
licence in; the sources and dependencies out.

48 tests covering run boundaries, punctuation at every kind of edge, phone numbers, URLs, emails,
hashtags, guillemets, combining marks, base direction, isolates, control-character stripping, the
HTML builders, the font and CSS tokens, the audit rules, ESM/CJS parity, the absence of `node:`
imports in the browser build, the single-file browser bundle (loaded as a browser would, and as a
CommonJS file, then compared against the module build), the demo server, and refusal to serve a path
outside the package. CI runs the same suite on Windows.

## Windows

Everything here runs on Windows, and CI proves it on every push (the `bidi-kit on Windows` job):

- the build invokes `node_modules/typescript/bin/tsc` with the current Node binary, never the
  `.bin/tsc` shim, which is a `.cmd` file on Windows and cannot be spawned directly;
- test discovery passes a glob to `node --test`, which expands it itself, so it does not depend on
  the shell;
- `npm run pack:check` is a script, not a shell one-liner.

One thing to watch: `cmd.exe` has no inline comments. `npm publish  # ready` sends `#` and `ready` to
npm as a tag, and npm will refuse. Copy the commands without the annotations.

## Licence

MIT. See [LICENSE](LICENSE).
