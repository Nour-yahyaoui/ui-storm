# ui-storm

Accessibility-first, right-to-left-native UI components for Rust.

Components are server-rendered HTML built with [Maud](https://maud.lambda.xyz/), served by
[Actix Web](https://actix.rs/). There is no client framework, no hydration and no build step: the
markup is the source of truth, and a 5 kB script adds only the behaviour HTML cannot express.

[![CI](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/ci.yml/badge.svg)](https://github.com/Nour-yahyaoui/ui-storm/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-black.svg)](LICENSE)

## Why this exists

Most component libraries treat accessibility as a checklist applied at the end, and treat
right-to-left as a stylesheet flip. Both fail in the same way: the guarantee is asserted in a
document, not in the build.

ui-storm inverts that. The label is a required argument, so an unlabelled input does not compile.
The stylesheet contains no physical property, so there is nothing to mirror. Contrast ratios are
computed from the shipped CSS in a test, so a colour tweak that breaks legibility fails CI. Every
page of the gallery is run through axe in both themes and both directions.

## Quick start

```toml
[dependencies]
ui-storm = "0.1.0"
maud = "0.27"
actix-web = "4"
```

```rust
use actix_web::{get, App, HttpResponse, HttpServer};
use maud::{html, Markup};
use ui_storm::{Button, ButtonVariant, Input, InputType};

fn sign_in_form() -> Markup {
    html! {
        (Input::new("email", "Email address", "email")
            .input_type(InputType::Email)
            .autocomplete("email")
            .required(true)
            .render())
        (Button::new("Sign in").variant(ButtonVariant::Primary).render())
    }
}

#[get("/")]
async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(sign_in_form().into_string())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(index))
        .bind(("0.0.0.0", 8080))?
        .run()
        .await
}
```

The page needs two assets: `crates/ui-storm/assets/ui-storm.css` and `ui-storm.js`. Serve them from
your own routes (the gallery shows how), or copy them into your static directory.

## The gallery

The documentation site is a real Actix Web app built from the library, so a broken component breaks
the docs.

```bash
cargo run --package ui-storm-web
# http://0.0.0.0:8080
```

| Route | What it shows |
| --- | --- |
| `/` | Overview, component index, verification matrix |
| `/foundations` | Palette, measured contrast ratios, type and spacing scale |
| `/components/{name}` | Live demos, ARIA contract, keyboard table, real rendered markup |
| `/accessibility` | The six rules and how each one is tested |
| `/rtl` | The whole gallery in Arabic, right to left |
| `/assets/ui-storm.css`, `/assets/ui-storm.js` | The shipped assets |

Language and theme are server-side decisions: `?lang=ar` renders `<html lang="ar" dir="rtl">`,
`?theme=dark` renders the dark palette. Every page has one URL and no client state.

## Components

Shipped in this first drop:

| Component | Element | Notes |
| --- | --- | --- |
| Button | `<button>` | Four variants, three sizes, loading state that never renames the button |
| Icon button | `<button>` | Name is visually hidden text, never a drifting `aria-label` |
| Text input | `<input>` | Label, description and error wired by the component |
| Checkbox | `<input type="checkbox">` | Native, including the indeterminate state |
| Dialog | `<dialog>` | Platform focus trap, ARIA naming, focus return |
| Tabs | `[role=tablist]` | Direction-aware arrow keys, works without JavaScript |

Planned and tracked in the backlog: link, select, combobox, radio group, switch, textarea, field
group, slider, date field, file upload, error summary, tooltip, popover, menu, drawer, command
palette, accordion, breadcrumb, pagination, stepper, tree view, alert, toast, progress, spinner,
empty state, table, card, badge, avatar.

## The same decision in Rust

`packages/bidi-kit` decides where a sentence changes direction in JavaScript.
`crates/bidi-kit` decides the same thing in Rust, from the same rules, before the
HTML exists — which is what a server-rendered page needs, and what a Dioxus app
needs if it is ever to hydrate without disagreeing with itself.

```rust
use bidi_kit::{segments, Direction};

let runs = segments("Write to أحمد.", None);
assert_eq!(runs[1].dir, Direction::Rtl);
assert_eq!(runs[1].text, "أحمد");
```

With the `dioxus` feature it also ships a component that renders one `<bdi>` per
run. See [`docs/dioxus.md`](docs/dioxus.md).

The two implementations are kept in step by a fixture file generated from the
JavaScript and read by both test suites, and by character tables generated from
Node's own Unicode properties — so "the port agrees with the library" is a claim
CI can refute.

## Verification

Nothing here is a claim without a test.

| Claim | Enforced by |
| --- | --- |
| Text meets 4.5:1, boundaries and focus rings 3:1, in both themes | `crates/ui-storm/src/tokens.rs` |
| The stylesheet and the Rust palette never diverge | `stylesheet_palette_matches_the_rust_tokens` |
| No physical CSS property exists | `stylesheet_uses_only_logical_properties` |
| Labels, ids and ARIA relationships are present and unique | `crates/ui-storm/tests/components.rs` |
| Every page answers, in both directions, with one `h1` and a skip link | `crates/ui-storm-web/tests/gallery.rs` |
| No serious axe violation, no keyboard trap, no focus loss | `tests/e2e/*.spec.ts` |
| The backlog is generated, never hand-edited | `python3 scripts/build_backlog.py --check` |
| The Rust port and the npm package split text identically | `packages/bidi-kit/tests/corpus.json`, read by both suites |
| The port classifies characters as the reference does | `node tools/gen-unicode-tables.mjs --check` |

Run everything locally:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- --deny warnings
cargo test --workspace
npm ci && npx playwright install chromium && npx playwright test
python3 scripts/build_backlog.py --check
```

## Repository layout

```
crates/ui-storm/           The library: components, direction, tokens, assets
  src/components/          One module per component, props struct + render()
  src/direction.rs         Locale -> Direction, RTL language and script tables
  src/tokens.rs            Palette, contrast maths, stylesheet sync checks
  assets/ui-storm.css      The only stylesheet. Logical properties only.
  assets/ui-storm.js       Progressive enhancement, dependency-free
  tests/components.rs      Markup contracts
crates/ui-storm-web/       The gallery: routes, layout, pages
packages/bidi-kit/         npm package: Arabic in English, French in Arabic, no bidi glitches
crates/bidi-kit/           The same decisions in Rust: segments, isolates, a Dioxus component
tests/e2e/                 Playwright: axe, keyboard, RTL, no-JavaScript
backlog/issues.json        Generated backlog, 332 issues across 13 milestones
docs/                      Guides, accessibility statement, ADRs, backlog index
tools/                     Generators for the shared corpus and tables, and the
                           script that assembles the standalone bidi-kit repository
scripts/build_backlog.py   Backlog generator (also publishes)
```

## Backlog

`docs/backlog.md` is the readable index; `backlog/issues.json` is canonical. Both are generated.
907 issues across 15 milestones: 30 planned components and 6 shipped ones, each with seven build
aspects plus a cost, localisation and example aspect; a locale dossier for the fourteen right-to-left
scripts; one entry per WCAG 2.2 A and AA success criterion; a browser and assistive-technology
matrix; framework integrations; guides; and the operational work the gallery still needs.

```bash
python3 scripts/build_backlog.py           # regenerate
python3 scripts/build_backlog.py --check   # what CI runs
python3 scripts/build_backlog.py --publish # create missing GitHub issues
```

The 376 issues from the earlier React/TypeScript implementation remain open as history; they are
superseded by this backlog, and the decision to rebuild is recorded in
[`docs/adr/0002-rust-rewrite.md`](docs/adr/0002-rust-rewrite.md).

## Documentation

- [getting started](docs/getting-started.md)
- [accessibility statement](docs/accessibility.md)
- [direction and internationalisation](docs/direction.md)
- [inline direction and the `bidi-kit` package](docs/bidi-kit.md)
- [using the Rust crate, and Dioxus](docs/dioxus.md)
- [moving `bidi-kit` into its own repository](docs/standalone-repo.md)
- [architecture decisions](docs/adr/)
- [contributing](CONTRIBUTING.md)

## Licence

MIT. See [LICENSE](LICENSE).
