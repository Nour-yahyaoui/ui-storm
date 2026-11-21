# Handoff: use `bidi-kit` in a Dioxus app

Paste this file into the session that owns the Dioxus app. It is written to be
read by somebody — or something — that has never seen this repository.

---

## What you are adding, and why

`bidi-kit` decides **where a string changes direction** and **isolates the runs**.
It exists because the browser implements the Unicode bidi algorithm correctly but
cannot know where the author meant a boundary: punctuation, digits, signs and
percent signs are *neutral*, so they take their direction from their neighbours.
That is why `+216 71 123 456` comes apart inside an Arabic sentence, why `15%`
comes out as `%15`, and why an English full stop after an Arabic name lands on
the wrong side of it.

It is a Rust crate (`bidi_kit`) with an optional Dioxus layer. It is **not on
crates.io** — depend on it by git or by path.

## The one rule that matters

**Decide direction in Rust, during render.** Do not load the JavaScript build
(`dist/bidi-kit.global.js`) and correct the page after hydration. Dioxus requires
the server and the client to produce the same virtual DOM; a `dir` chosen by a
`<script>` after the first paint is a `dir` they disagree about, and the result is
a hydration mismatch in exactly the component that renders user content.

## 1. Check the Dioxus version before you write the dependency

```bash
cargo tree -i dioxus | head -5
```

- **dioxus 0.7.x** — you can use the `dioxus` feature and the `MixedText`
  component.
- **anything else (0.6, 0.8 alpha, …)** — do **not** enable the feature. The crate
  pins `dioxus = "0.7"`, so enabling it pulls a second copy of the framework and
  `Element` from one is not `Element` from the other. Use the core API and the
  five-line component in §4. The core has no Dioxus dependency at all.

## 2. Add the dependency

```toml
[dependencies]
# core only — no framework, works in Maud, Axum, plain HTML too
bidi-kit = { git = "https://github.com/Nour-yahyaoui/ui-storm", package = "bidi-kit", branch = "main" }

# with the component (dioxus 0.7 only)
bidi-kit = { git = "https://github.com/Nour-yahyaoui/ui-storm", package = "bidi-kit", branch = "main", features = ["dioxus"] }
```

The crate lives in the `ui-storm` monorepo until `github.com/Nour-yahyaoui/bidi-kit`
exists; when it does, point the URL there. Pin what you depend on — `rev = "<sha>"`
instead of `branch = "main"` — once you have picked a commit, because `main` moves.

If the monorepo is already on disk, a path dependency is simpler and does not
need the network:

```toml
bidi-kit = { path = "C:/Users/HP/ui-storm/crates/bidi-kit", features = ["dioxus"] }
```

Constraints: edition 2021, MSRV 1.82, no default features, `unsafe_code`
forbidden.

## 3. The API, exactly

| Call | Returns | Use it for |
| --- | --- | --- |
| `segments(text: &str, base: Option<Direction>)` | `Vec<Segment>` | where each run starts and ends; the whole API, really |
| `Segment { text: &str, dir: Direction, start: usize, end: usize }` | | `start`/`end` are **byte** offsets |
| `detect_direction(text) -> Option<Direction>` | | `dir="auto"` semantics; `None` = no strong character |
| `resolve_direction(text) -> Direction` | | the same, with the HTML fallback applied (never `None`) |
| `Direction::{Ltr, Rtl}` | | `.as_str()`, `.is_rtl()`, `.flipped()`, `Display`, `FromStr` |
| `isolate(text, Option<Direction>) -> String` | | plain-text contexts: terminals, aria-labels, JSON |
| `isolate_runs_text(text) -> String` | | the same, per run |
| `has_bidi_controls(text)`, `strip_bidi_controls(text)` | | anything a stranger typed |
| `has_rtl(text)`, `has_arabic(text)` | | cheap probes |
| `bdi_html`, `inline_html`, `paragraph_html` | `String` | only when you are writing strings, not nodes |
| `MixedText` (feature `dioxus`) | `Element` | the component in §4 |

`base` decides the paragraph, not the run: pass `Some(base)` when the surrounding
document's direction is already known, `None` and let the first strong character
decide otherwise.

## 4. The component

```rust
use bidi_kit::MixedText;

rsx! {
    p { dir: "ltr",
        MixedText { text: line.clone() }   // String, not &str
    }
}
```

It renders one `<bdi dir>` per run:

```html
<p dir="ltr"><bdi dir="ltr">Sent to </bdi><bdi dir="rtl">أحمد</bdi><bdi dir="ltr"> this morning.</bdi></p>
```

**Without the feature** — the same thing in five lines, and the version you want
when the page already knows its direction:

```rust
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

## 5. Where the base direction comes from

One `Direction` per document, resolved once from the locale and written to
`<html dir>`. Paragraphs inherit it. This crate does not resolve locales — use
whatever the app already uses for that (a BCP-47 tag to `Direction` mapping), then:

```rust
let base = my_locale_to_direction(locale);
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

Passing the base matters at the edges: a trailing full stop with no strong
character after it, and a string of digits with no direction of its own.

## 6. Non-negotiables

- **`<bdi>`, not `<span dir>`.** A span with a `dir` attribute reorders its
  contents; it does not isolate them from the paragraph. `<bdi>` does.
- **Build nodes, don't inject HTML.** `paragraph_html` exists for Maud and for
  places that genuinely write strings. In `rsx!`, use elements — Dioxus then
  escapes for you and you do not have to remember to.
- **Offsets are bytes.** `&text[run.start..run.end]` is the run. If you are porting
  highlight or caret logic from JavaScript, or from anything that counted UTF-16
  units, convert first — U+1EE00 is one char, four bytes, two UTF-16 units.
- **`detect_direction` returns `Option`.** `None` is not an error; it means the
  string has no strong character. Use `resolve_direction` when you need a value
  for an attribute.
- **Strip controls from user text** before it reaches a filename, a diff, a log or
  a terminal: `strip_bidi_controls` (U+202E inside a filename is a spoofing bug,
  not a feature).

## 7. Prove it works

Two tests worth having from the start:

```rust
use bidi_kit::{segments, Direction};

#[test]
fn an_arabic_name_inside_english_keeps_the_full_stop_outside() {
    let runs = segments("Write to أحمد.", None);
    assert_eq!(runs.last().unwrap().dir, Direction::Ltr);
    assert_eq!(runs.last().unwrap().text, ".");
}

#[test]
fn a_phone_number_stays_one_left_to_right_run_inside_arabic() {
    let runs = segments("الهاتف: +216 71 123 456", None);
    assert!(runs.iter().any(|run| run.dir == Direction::Ltr && run.text.contains("216 71 123")));
}
```

And the commands the app's CI should run:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- --deny warnings
cargo test --workspace
cargo check --package <app> --features dioxus   # only if the component is used
```

Then look at a page with `الهاتف: +216 71 123 456` in it and confirm the `+` sits
against the digits rather than at the far end. A passing test suite is not the
same as a correct paragraph.

## 8. Known limits — do not design around them

- **Not ported from the JavaScript package:** the font stacks (`FONT_STACKS`), the
  stylesheet (`CSS`, `ROOT_CSS`) and `audit`/`formatAudit`. If an Arabic page needs
  the line-height and isolation rules, ship the CSS from the npm package — it is
  plain CSS and does not need JavaScript.
- **Two known defects, inherited:** `تقرير.pdf` loses its full stop to the Arabic
  run, and `A(0 ; 2)` loses its closing bracket to the run that follows (where it
  is mirrored). Do not use coordinate strings or Latin file extensions as test
  fixtures, and if the app renders them, isolate the Latin part yourself:

  ```rust
  rsx! { bdi { dir: "ltr", "A(0 ; 2)" } }
  ```

- **Not published on crates.io** (`publish = false` in the manifest). A git or path
  dependency is the way in.

## 9. Checklist

- [ ] Dioxus version checked against the feature pin (0.7 → feature, anything else → core API)
- [ ] dependency pinned to a `rev`, not to `main`
- [ ] `<html dir>` written during render, never by a script
- [ ] `<bdi>` used, not `<span dir>`
- [ ] byte offsets, not UTF-16 indices
- [ ] the two tests above added and passing
- [ ] clippy clean with `--deny warnings`
