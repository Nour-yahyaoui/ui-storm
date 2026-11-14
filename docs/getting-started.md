# Getting started

## Install

```toml
[dependencies]
ui-storm = { path = "crates/ui-storm" }   # or "0.1.0" once published
maud = "0.27"
actix-web = "4"
```

## Render a component

Every component is a props struct with a builder and a `render() -> Markup` method. Rendering is
pure: no request access, no global state, no hidden defaults that depend on the environment.

```rust
use maud::{html, Markup};
use ui_storm::{Button, ButtonVariant, Input, InputType};

pub fn sign_in_form() -> Markup {
    html! {
        form method="post" action="/sessions" {
            (Input::new("email", "Email address", "email")
                .input_type(InputType::Email)
                .autocomplete("email")
                .description("We only use it to send sign-in links.")
                .required(true)
                .render())
            (Input::new("password", "Password", "password")
                .input_type(InputType::Password)
                .autocomplete("current-password")
                .required(true)
                .render())
            (Button::new("Sign in").variant(ButtonVariant::Primary).kind(ui_storm::ButtonKind::Submit).render())
        }
    }
}
```

Three things to notice:

- `Input::new` takes the id, the label and the name. There is no way to render an input without a
  label, which is the point.
- `description` is linked with `aria-describedby` automatically; you never write the id yourself.
- `Button::kind(ButtonKind::Submit)` is explicit. Buttons default to `type="button"` so a stray
  button never submits a form.

## Serve the assets

The stylesheet and the enhancement script live in `crates/ui-storm/assets/`. They are also compiled
into the library, so you can serve them without a build step:

```rust
use actix_web::{get, HttpResponse};
use ui_storm::assets;

#[get("/assets/ui-storm.css")]
async fn stylesheet() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/css; charset=utf-8")
        .body(assets::CSS)
}

#[get("/assets/ui-storm.js")]
async fn script() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/javascript; charset=utf-8")
        .body(assets::SCRIPT)
}
```

Load the script with `defer`. The markup is complete without it; the script adds modal dialogs, tab
keyboard navigation and the indeterminate checkbox state.

## Set the direction

Direction is resolved once, from the locale, and written to `<html>`:

```rust
use maud::{html, Markup, DOCTYPE};
use ui_storm::{locale_direction, Direction};

pub fn page(lang: &str, content: Markup) -> Markup {
    let dir: Direction = locale_direction(lang);
    html! {
        (DOCTYPE)
        html lang=(lang) dir=(dir.as_str()) {
            head { /* ... */ }
            body { (content) }
        }
    }
}
```

Nothing else in your templates needs to know about direction. See [direction](direction.md).

## Theme

Light is the default. Add `data-theme="dark"` to `<html>` for the dark palette, and remember to also
emit `color-scheme` — the stylesheet does it for you inside the `[data-theme="dark"]` block.

## What to read next

- [accessibility](accessibility.md) — what is guaranteed, and what is reviewed by hand.
- [direction](direction.md) — the RTL model, bidi isolation and numerals.
- [the gallery](../README.md#the-gallery) — every component with live demos.
