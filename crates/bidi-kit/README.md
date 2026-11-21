# bidi-kit (Rust)

Bidirectional text for Rust: where a sentence changes direction, and how to
isolate the pieces.

This is the Rust half of [`bidi-kit`](https://www.npmjs.com/package/bidi-kit),
answering the same question with the same rules:

> The browser implements the Unicode bidirectional algorithm correctly. What it
> cannot know is where the author meant a boundary to be.

The reason to have it in Rust is not speed. It is that the decision has to happen
*before* the HTML is written: a direction chosen by a `<script>` after the first
paint is a direction the server did not know about, and a server-rendered
framework that has to hydrate will disagree with itself.

```rust
use bidi_kit::{segments, Direction};

let runs = segments("Write to أحمد.", None);
assert_eq!(runs[1].dir, Direction::Rtl);
assert_eq!(runs[1].text, "أحمد");
```

## What it does

| Question | Function |
| --- | --- |
| Which way is this string? | `detect_direction` (`dir="auto"` semantics), `resolve_direction` (never `None`) |
| Where does each run start and end? | `segments(text, base)` |
| How do I keep a run from leaking? | `<bdi>` via `bdi_html`, or `isolate` / `isolate_runs_text` for plain text |
| Is this string safe to render? | `has_bidi_controls`, `strip_bidi_controls` |
| One paragraph out of mixed parts? | `paragraph_html` with `Part::Text` and `Part::Run` |

## Dioxus

With the `dioxus` feature there is a component that renders one `<bdi>` per run:

```toml
bidi-kit = { path = "crates/bidi-kit", features = ["dioxus"] }
```

```rust,ignore
use bidi_kit::MixedText;

rsx! {
    p { dir: "ltr",
        MixedText { text: String::from("Sent to أحمد this morning.") }
    }
}
```

The full guide — including the Dioxus SSR and hydration argument, and the Maud
route with no Dioxus at all — is [`docs/dioxus.md`](../../docs/dioxus.md).

## Differences from the JavaScript package

Two, both deliberate:

- **Offsets are byte offsets, not UTF-16 indices.** `Segment::start` and
  `Segment::end` index the UTF-8 string, so `&text[run.start..run.end]` is always
  the run. For Arabic, Hebrew and their punctuation the two agree; for a
  character outside the basic plane — Arabic mathematical alphabetic symbols, for
  instance — they do not.
- **`detect_direction` returns `Option<Direction>`.** JavaScript returns the
  string `"neutral"`, which is a third case pretending to be a direction.
  `resolve_direction` is the version that always answers.

## What is not here yet

The font stacks, the stylesheet and `audit()` live in the npm package and have
not been ported. If you need them from Rust today, use the JavaScript package
from the page and this crate on the server; they make the same decisions.

## Keeping the port honest

`packages/bidi-kit/tests/corpus.json` is generated from the JavaScript, and both
`packages/bidi-kit/tests/corpus.test.mjs` and `crates/bidi-kit/tests/corpus.rs`
read it. The Unicode tables in `src/tables.rs` are generated too:

```bash
node tools/gen-unicode-tables.mjs           # rewrite from Node's own properties
node tools/gen-unicode-tables.mjs --check   # what CI runs
node tools/gen-corpus.mjs                   # rewrite the shared fixtures
```

Not published to crates.io: `publish = false`. The npm package is the published
artifact; this crate is for the Rust side of the same project.
