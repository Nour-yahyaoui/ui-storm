# Using `bidi-kit` in Dioxus

[`docs/bidi-kit.md`](bidi-kit.md) covers the npm package: a sentence inside a
page, decided in JavaScript. This page covers the same decision made in Rust,
before the HTML exists — which is the only place it can be made in a
server-rendered framework.

The crate lives in [`crates/bidi-kit`](../crates/bidi-kit/README.md).

## The short answer

It works, but not by loading `bidi-kit.global.js` into your app. Dioxus is Rust;
the reason to want bidi-kit there is exactly the reason a JavaScript bundle is the
wrong shape for it.

## Why not the script tag

Dioxus's own server-side rendering documentation makes the argument:

> the client picks up its VirtualDOM assuming that the pre-rendered page output is
> the same. To do this, you need to make sure that your VirtualDOM implementation
> is deterministic.

If direction is decided by a `<script>` after the page loads, the server's HTML
and the client's virtual DOM disagree by construction: the server wrote one
`dir` and the browser then rearranges the text under it. The best case is a flash
of incorrectly ordered text. The ordinary case is a hydration mismatch, and a
mismatch in a component that renders user content is a bug that reproduces on
some machines and not others.

Deciding in Rust means the server and the client run the same function on the
same string. They cannot disagree, because there is nothing left to decide later.

## Three routes, and what each one costs

| Route | Where it works | What it costs |
| --- | --- | --- |
| Port the decision to Rust — **this crate** | web, SSR, desktop, mobile | two implementations to keep in step, which is what the shared corpus is for |
| Call the JavaScript from wasm (`document::eval`, `js_sys`) | browser only | async, a network dependency, a CSP entry, no SSR, and the hydration mismatch above |
| No library: `<bdi>` around every dynamic string, `dir="auto"` on containers | everywhere, today | the browser's algorithm for free; nothing for numbers, `+`, `%`, or the boundaries |

If you only need to stop a word from dragging its neighbours around, the third
route is enough and needs no dependency. The first route is for the cases the
third one cannot reach: a phone number inside an Arabic sentence, a price with a
thousands separator, an English full stop after an Arabic name.

## Install

The crate is a workspace member and is not published to crates.io, so depend on
it by path:

```toml
[dependencies]
bidi-kit = { path = "crates/bidi-kit" }
```

For the Dioxus component, add the feature:

```toml
[dependencies]
bidi-kit = { path = "crates/bidi-kit", features = ["dioxus"] }
```

The feature is off by default on purpose: a Maud template or an Actix handler
needs the runs, not a UI framework. It pulls in `dioxus` 0.7 with default
features — if you pin a different Dioxus version, pin it here too, or the
component will be compiled against two copies of the framework.

## The component

```rust,ignore
use bidi_kit::MixedText;

rsx! {
    p { dir: "ltr",
        MixedText { text: String::from("Sent to أحمد this morning.") }
    }
}
```

`MixedText` renders one `<bdi>` per direction run:

```html
<p dir="ltr"><bdi dir="ltr">Sent to </bdi><bdi dir="rtl">أحمد</bdi><bdi dir="ltr"> this morning.</bdi></p>
```

Three things are worth knowing about that markup:

- **`<bdi>`, not `<span dir>`.** `<bdi>` is the one element whose whole job is
  isolation, and the browser applies `unicode-bidi: isolate` to it by default. A
  span with a `dir` attribute reorders its contents and does not isolate them
  from the paragraph.
- **The base direction comes from the text**, which is what `dir="auto"` does.
  When you already know the paragraph direction — an Arabic column, a French
  email — pass it explicitly and skip the guessing.
- **No `dangerous_inner_html`.** The component builds nodes, so Dioxus escapes
  the text. The JavaScript package's `paragraph()` returns a string, which is the
  right thing for a string writer and the wrong thing for a node builder.

## Without the component

You usually do not want a component. `segments` is the whole API, and it composes
with anything:

```rust,ignore
use bidi_kit::{segments, Direction};

fn mixed_line(text: &str, base: Option<Direction>) -> Element {
    let runs = segments(text, base);
    rsx! {
        for run in runs {
            bdi { dir: run.dir.as_str(), "{run.text}" }
        }
    }
}
```

That is the same function the component calls, in about the same number of lines,
and it takes a base direction — which is what you want when the surrounding
paragraph is already decided.

## Where the base direction is known

A page has a direction before it has sentences. `ui-storm` resolves it from the
locale — `direction::locale_direction("ar-EG")` is `Direction::Rtl` — and writes
it to `<html dir>`. Inside that page, every paragraph inherits:

```rust,ignore
let base = ui_storm::direction::locale_direction(locale);
rsx! {
    html { dir: base.as_str(), lang: "{locale}",
        body {
            for line in lines {
                mixed_line(line, Some(base))
            }
        }
    }
}
```

Passing the base matters most at the edges: a full stop at the end of a paragraph
with no strong character after it, or a string of digits that has no direction of
its own.

## Maud, or plain Axum

Nothing in the crate knows Dioxus exists, so the same decision is available where
the HTML is a string:

```rust,ignore
use bidi_kit::{bdi_html, paragraph_html, HtmlOptions, Part};

let html = paragraph_html(
    &[
        Part::Text("Sent to "),
        Part::Run { text: "أحمد", dir: None, lang: Some("ar"), font: None },
        Part::Text(" this morning."),
    ],
    HtmlOptions::default(),
);
```

`paragraph_html` writes `<p dir="ltr">` and one `<bdi>` per named part. If you are
in Maud, prefer building the `bdi` elements in the macro and let Maud escape for
you — the string builders are there for the places that genuinely write strings.

## Differences from the JavaScript package

Both are deliberate, and both are the kind of difference that silently corrupts
output if you assume otherwise.

**Offsets are bytes, not UTF-16 units.** `Segment::start` and `Segment::end` index
the UTF-8 string, so `&text[run.start..run.end]` always equals `run.text`. The
JavaScript reports UTF-16 indices. For Arabic and Hebrew — including their
punctuation and Arabic-Indic digits — the two agree, because everything is inside
the basic multilingual plane. For a character outside it, they do not: U+1EE00
ARABIC MATHEMATICAL ALEF is one `char`, four bytes in UTF-8 and two UTF-16 units.
If you are porting a highlight or a caret position from JavaScript, convert.

**`detect_direction` returns `Option<Direction>`.** The JavaScript returns the
string `"neutral"` for a string with no strong character, which is a third case
pretending to be a direction. Rust says `None`, and
`resolve_direction` is the `dir="auto"` fallback that always answers.

## What is not ported

`FONT_STACKS`, `fontStack`, the stylesheet (`CSS`, `ROOT_CSS`), `audit` and
`formatAudit` exist in the npm package and are not in the crate yet. Fonts are
the one that matters for an Arabic page: a Latin-only stack with Arabic text
gets a per-glyph fallback, and one word is drawn in two faces. Until that is
ported, ship the CSS from the package, or copy the relevant rules — they are
plain CSS and do not depend on JavaScript.

Two defects are known in the segmenter itself and are inherited by the port
rather than fixed in it:

- `تقرير.pdf` — the full stop detaches from the Latin extension and joins the
  Arabic run.
- `A(0 ; 2)` — a closing bracket at the end of a Latin run is separated from its
  coordinate and lands in the following Arabic run, where it is mirrored.

Both are "a neutral adjacent to a Latin run at a boundary". Fixing them belongs in
both implementations at once, which means a fixture in the shared corpus first.

## Keeping the two implementations honest

Three generated files, three generators:

```bash
node tools/gen-unicode-tables.mjs           # crates/bidi-kit/src/tables.rs
node tools/gen-unicode-tables.mjs --check   # what CI runs
node tools/gen-corpus.mjs                   # packages/bidi-kit/tests/corpus.json
```

The character tables are generated from Node's own `\p{L}`, `\p{M}`, `\p{Cf}`,
`\p{Z}` and `\p{Nd}` at the Unicode version Node actually ships, so the port
classifies a character the way the reference does rather than the way a table file
from a different Unicode edition says.

The corpus is generated from the JavaScript, which is the reference, and read by
both test suites: `packages/bidi-kit/tests/corpus.test.mjs` checks that the
reference is still the reference, and `crates/bidi-kit/tests/corpus.rs` checks
that the port agrees with it. A disagreement fails CI on whichever side drifted.

An empty corpus would make both tests pass and prove nothing, so the Rust test
also asserts the fixtures are not empty, and the JavaScript test asserts they
cover the cases that actually break: a signed phone number, a percentage, a
character outside the BMP, a bidi override, and the empty string.
