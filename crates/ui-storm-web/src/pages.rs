//! The gallery pages.
//!
//! Documentation is generated from the components themselves: every "Markup"
//! block on a component page is the real `render()` output, so a doc snippet
//! cannot drift from the library.

use maud::{html, Markup};
use ui_storm::tokens::{self, Theme, AA_NON_TEXT, AA_TEXT};
use ui_storm::{
    locale_direction, Button, ButtonSize, ButtonVariant, Checkbox, Dialog, Direction, IconButton,
    Input, InputType, Tab, Tabs, TabsOrientation,
};

use crate::layout::PageContext;

/// A demo panel: live component, then a caption explaining what to check.
fn demo(canvas: Markup, caption: &str) -> Markup {
    html! {
        figure class="ui-demo" {
            div class="ui-demo__canvas" { (canvas) }
            figcaption class="ui-demo__caption" { (caption) }
        }
    }
}

/// A plain code block.
///
/// `tabindex="0"` is not decoration: a block that can scroll horizontally must
/// be reachable by keyboard, or its overflow is invisible to keyboard users.
fn code(source: &str) -> Markup {
    html! {
        pre class="ui-code" tabindex="0" { code { (source) } }
    }
}

/// A keyboard table: keys, behaviour.
fn keyboard(rows: &[(&str, &str)]) -> Markup {
    html! {
        table class="ui-table" {
            caption { "Keyboard interaction" }
            thead {
                tr { th scope="col" { "Keys" } th scope="col" { "Behaviour" } }
            }
            tbody {
                @for (keys, behaviour) in rows {
                    tr { td { (keys) } td { (behaviour) } }
                }
            }
        }
    }
}

/// The "ARIA contract" list shared by every component page.
fn contract(items: &[&str]) -> Markup {
    html! {
        ul class="ui-contract" {
            @for item in items { li { (item) } }
        }
    }
}

/// The palette for one theme, as swatches.
fn palette_list(theme: Theme) -> Markup {
    html! {
        ul class="ui-swatches" {
            @for (name, value) in tokens::palette(theme) {
                li class="ui-swatch" {
                    div class="ui-swatch__chip" style=(format!("background: {value}")) {}
                    div class="ui-swatch__meta" {
                        span class="ui-swatch__name" { (name) }
                        span { (value) }
                    }
                }
            }
        }
    }
}

/// Every audited contrast pair for one theme, with the measured ratio.
fn contrast_table(theme: Theme) -> Markup {
    html! {
        table class="ui-table" {
            caption {
                "Contrast in the "
                (theme.as_str())
                " theme. Body text needs "
                (AA_TEXT)
                ":1, UI boundaries and focus rings need "
                (AA_NON_TEXT)
                ":1."
            }
            thead {
                tr {
                    th scope="col" { "Use" }
                    th scope="col" { "Foreground" }
                    th scope="col" { "Background" }
                    th scope="col" { "Ratio" }
                    th scope="col" { "Required" }
                }
            }
            tbody {
                @for check in tokens::contrast_checks(theme) {
                    tr {
                        td { (check.label) }
                        td { code { (check.foreground) } }
                        td { code { (check.background) } }
                        td { (format!("{:.2}:1", check.ratio)) }
                        td { (format!("{:.1}:1", check.minimum)) }
                    }
                }
            }
        }
    }
}

/// The scale tokens declared in the stylesheet.
fn scale_table(prefix: &str, heading: &str) -> Markup {
    html! {
        h3 { (heading) }
        table class="ui-table" {
            thead {
                tr { th scope="col" { "Token" } th scope="col" { "Value" } }
            }
            tbody {
                @for (name, value) in tokens::scale_tokens(prefix) {
                    tr { td { code { (name) } } td { (value) } }
                }
            }
        }
    }
}

/// The landing page.
pub fn overview(ctx: &PageContext) -> Markup {
    let dependencies = r#"[dependencies]
ui-storm = "0.1.0"
maud = "0.27"
actix-web = "4""#;

    let usage = r#"use maud::Markup;
use ui_storm::{Button, ButtonVariant, Input, InputType};

fn sign_in_form() -> Markup {
    maud::html! {
        (Input::new("email", "Email address", "email")
            .input_type(InputType::Email)
            .autocomplete("email")
            .required(true)
            .render())
        (Button::new("Sign in")
            .variant(ButtonVariant::Primary)
            .render())
    }
}"#;

    html! {
        h1 { "ui-storm" }
        p class="ui-lede" {
            "Accessibility-first, right-to-left-native UI components for Rust. "
            "Server-rendered HTML built with Maud, served by Actix Web. No client "
            "framework, no hydration, no build step."
        }

        h2 { "Three rules" }
        ol {
            li {
                strong { "Names are required by construction. " }
                "The input cannot be rendered without a label; the icon button "
                "cannot be rendered without an accessible name. The type system "
                "refuses the broken version, so a reviewer never has to catch it."
            }
            li {
                strong { "Direction is resolved once. " }
                "A BCP-47 tag becomes a direction in one function, "
                code { "dir" }
                " and "
                code { "lang" }
                " land on "
                code { "<html>" }
                ", and the stylesheet contains no physical properties at all: no "
                code { "margin-left" }
                ", no "
                code { "left" }
                ", no "
                code { "text-align: left" }
                ". Mirroring is not a second stylesheet."
            }
            li {
                strong { "Every claim is a test. " }
                "Contrast ratios are computed from the shipped stylesheet, markup "
                "contracts are asserted on real output, and axe runs against every "
                "page of this gallery."
            }
        }

        h2 { "Components" }
        table class="ui-table" {
            caption { "The starting set. Each one is a documented page in this gallery." }
            thead {
                tr {
                    th scope="col" { "Component" }
                    th scope="col" { "Element" }
                    th scope="col" { "Why it exists" }
                }
            }
            tbody {
                tr {
                    td { a href=(ctx.href("/components/button")) { "Button" } }
                    td { code { "<button>" } }
                    td { "Four weights, three sizes, a loading state that never changes the name, and the disabled / aria-disabled distinction." }
                }
                tr {
                    td { a href=(ctx.href("/components/icon-button")) { "Icon button" } }
                    td { code { "<button>" } }
                    td { "A square control whose name is visually hidden text, not an aria-label that can go stale." }
                }
                tr {
                    td { a href=(ctx.href("/components/text-input")) { "Text input" } }
                    td { code { "<input>" } }
                    td { "Label, description and error wired up by the component instead of by hand." }
                }
                tr {
                    td { a href=(ctx.href("/components/checkbox")) { "Checkbox" } }
                    td { code { "<input type=\"checkbox\">" } }
                    td { "A real checkbox, including the indeterminate state HTML cannot express." }
                }
                tr {
                    td { a href=(ctx.href("/components/dialog")) { "Dialog" } }
                    td { code { "<dialog>" } }
                    td { "The platform's focus trap and top layer, plus the ARIA wiring the platform leaves to authors." }
                }
                tr {
                    td { a href=(ctx.href("/components/tabs")) { "Tabs" } }
                    td { code { "[role=tablist]" } }
                    td { "ARIA tabs with direction-aware arrow keys, and a no-JavaScript fallback that loses nothing." }
                }
            }
        }

        h2 { "Quick start" }
        p {
            "Add the crate, then render markup from a handler. The gallery you are "
            "reading is itself an Actix Web app built this way."
        }
        (code(dependencies))
        (code(usage))

        h2 { "What is checked, and where" }
        table class="ui-table" {
            thead {
                tr {
                    th scope="col" { "Claim" }
                    th scope="col" { "Enforced by" }
                }
            }
            tbody {
                tr {
                    td { "Every text pair meets 4.5:1 and every boundary 3:1, in both themes" }
                    td { code { "crates/ui-storm/src/tokens.rs" } }
                }
                tr {
                    td { "The stylesheet and the Rust palette never diverge" }
                    td { code { "stylesheet_palette_matches_the_rust_tokens" } }
                }
                tr {
                    td { "No physical CSS property sneaks in" }
                    td { code { "stylesheet_uses_only_logical_properties" } }
                }
                tr {
                    td { "Labels, ids and ARIA relationships are present and unique" }
                    td { code { "crates/ui-storm/tests/components.rs" } }
                }
                tr {
                    td { "No serious axe violation on any page, in either theme, in either direction" }
                    td { code { "tests/e2e/gallery.spec.ts" } }
                }
                tr {
                    td { "Keyboard behaviour: focus order, Escape, arrow keys, focus return" }
                    td { code { "tests/e2e/keyboard.spec.ts" } }
                }
            }
        }
    }
}

/// Design tokens and the contrast audit.
pub fn foundations(_ctx: &PageContext) -> Markup {
    html! {
        h1 { "Foundations" }
        p class="ui-lede" {
            "Colour, type and spacing are declared twice on purpose: once in CSS for "
            "the browser, once in Rust for the tests. The Rust copy is the one that "
            "fails the build when the two disagree."
        }

        h2 { "Palette" }
        @for theme in Theme::ALL {
            h3 { (format!("{} theme", capitalised(theme.as_str()))) }
            (palette_list(theme))
        }
        p {
            "The dark theme is not an inverted light theme: the accent and danger "
            "colours are re-picked for a dark background, and both variants are "
            "audited separately."
        }

        h2 { "Contrast audit" }
        p {
            "Ratios are computed with the WCAG 2.2 relative-luminance formula in "
            code { "src/tokens.rs" }
            " and re-derived on every test run, so a colour tweak that breaks "
            "legibility cannot be merged."
        }
        @for theme in Theme::ALL {
            h3 { (format!("{} theme", capitalised(theme.as_str()))) }
            (contrast_table(theme))
        }

        h2 { "Scale" }
        (scale_table("--ui-font-size-", "Type scale"))
        (scale_table("--ui-space-", "Spacing scale"))
        (scale_table("--ui-radius-", "Radii"))

        h2 { "Motion" }
        p {
            "Every transition and animation is disabled under "
            code { "prefers-reduced-motion: reduce" }
            ", including the button spinner. Nothing in the library depends on "
            "movement to communicate state."
        }
    }
}

/// The accessibility policy page.
pub fn accessibility(ctx: &PageContext) -> Markup {
    let rules = [
        "Native elements first. A button is a <button>, a dialog is a <dialog>, a checkbox is an <input type=\"checkbox\">. ARIA is used to describe, never to imitate.",
        "No icon without a name. The name is visually hidden text inside the control, so it is part of the accessible name computation and shows up in translation files alongside the label.",
        "No state carried by colour alone. Errors carry text and aria-invalid; the loading state carries aria-busy and words; selection carries aria-selected.",
        "No outline removal. Focus has one ring, in the accent colour, 3px, offset 2px, in both themes, with a 6.7:1 or better ratio.",
        "No physical CSS. Direction is handled with logical properties, and the only direction-specific rule in the stylesheet mirrors directional glyphs.",
        "No JavaScript requirement for content. Tabs, dialogs and fields are all readable and operable as HTML; the 5 KB script adds convenience and keyboard chords, not content.",
    ];

    let keyboard_rows = [
        ("Tab / Shift+Tab", "Moves through controls in document order. Icon buttons and inputs are all reachable; aria-disabled controls stay in the order by design."),
        ("Enter / Space", "Activates a focused button. Space toggles a checkbox; Enter submits a form."),
        ("Escape", "Closes an open dialog and returns focus to the trigger."),
        ("Arrow keys, tabs", "Move between tabs, following the reading direction: in RTL, ArrowRight moves to the previous tab. Home and End jump to the first and last."),
    ];

    html! {
        h1 { "Accessibility" }
        p class="ui-lede" {
            "Six rules, each with a test behind it. Accessibility that is not tested is "
            "a slogan; these are the checks that fail the build."
        }

        h2 { "Rules" }
        ul class="ui-contract" {
            @for rule in rules { li { (rule) } }
        }

        h2 { "Keyboard" }
        (keyboard(&keyboard_rows))

        h2 { "Contrast" }
        p {
            "Body text meets "
            (AA_TEXT)
            ":1, UI boundaries, focus rings and large text meet "
            (AA_NON_TEXT)
            ":1. The full table, with measured ratios, is on the "
            a href=(PageContext::href(ctx, "/foundations")) { "foundations page" }
            "."
        }

        h2 { "Right-to-left" }
        p {
            "Direction comes from the locale, not from a guess: "
            code { "locale_direction(\"ar\")" }
            " is "
            code { "Rtl" }
            ", "
            code { "locale_direction(\"ku\")" }
            " is "
            code { "Ltr" }
            " by design, and a script subtag wins over the base language, so "
            code { "az-Arab" }
            " renders right to left. The "
            a href=(PageContext::href(ctx, "/rtl")) { "RTL page" }
            " renders the whole gallery in Arabic to prove it."
        }

        h2 { "What verification looks like" }
        ol {
            li { code { "cargo test" } " — unit tests for direction resolution and contrast maths, markup contract tests for every component, HTTP tests for every page." }
            li { code { "cargo clippy -- -D warnings" } " — no lints, no warnings, no exceptions." }
            li { code { "playwright + axe" } " — every page in light and dark, LTR and RTL, with zero serious or critical violations allowed." }
            li { code { "playwright keyboard" } " — focus order, Escape returning focus, arrow-key tab navigation in both directions." }
        }

        h2 { "Known limits" }
        p {
            "The gallery is not a screen-reader test suite. axe catches roughly a "
            "third of real-world issues: it cannot judge whether a name is "
            "meaningful, whether an order is logical, or whether a message is "
            "announced at the right moment. Those are reviewed by hand and noted "
            "in the component pages."
        }
    }
}

/// Uppercases the first character.
fn capitalised(value: &str) -> String {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars).collect(),
        None => String::new(),
    }
}

/// Keeps `Direction` and `locale_direction` in the public surface of this file
/// for the pages that render Arabic content.
pub(crate) fn arabic_direction() -> Direction {
    locale_direction("ar")
}

/// Dispatches a component documentation page, appending the RTL link.
pub fn component(name: &str, ctx: &PageContext) -> Option<Markup> {
    let (path, page) = match name {
        "button" => ("/components/button", button_page()),
        "icon-button" => ("/components/icon-button", icon_button_page()),
        "text-input" => ("/components/text-input", text_input_page()),
        "checkbox" => ("/components/checkbox", checkbox_page()),
        "dialog" => ("/components/dialog", dialog_page()),
        "tabs" => ("/components/tabs", tabs_page()),
        _ => return None,
    };

    Some(html! {
        (page)
        (page_footer(ctx, path))
    })
}

fn page_footer(ctx: &PageContext, path: &str) -> Markup {
    html! {
        p class="ui-badge" {
            "Prefer Arabic? "
            a href=(ctx.lang_href(path, "ar")) { "Open this page right to left" }
        }
    }
}

fn button_page() -> Markup {
    let snippet = Button::new("Save changes")
        .variant(ButtonVariant::Primary)
        .render()
        .into_string();

    html! {
        h1 { "Button" }
        p class="ui-lede" {
            "A native button with four weights, three sizes, and an honest "
            "distinction between 'cannot be activated' and 'is unavailable right "
            "now'. Both are things teams usually get wrong in opposite directions."
        }

        h2 { "Variants" }
        (demo(
            html! {
                div class="ui-row" {
                    (Button::new("Primary").render())
                    (Button::new("Secondary").variant(ButtonVariant::Secondary).render())
                    (Button::new("Ghost").variant(ButtonVariant::Ghost).render())
                    (Button::new("Danger").variant(ButtonVariant::Danger).render())
                }
            },
            "One dominant action per view. Ghost for tertiary actions inside dense rows."
        ))

        h2 { "Sizes" }
        (demo(
            html! {
                div class="ui-row" {
                    (Button::new("Small").size(ButtonSize::Sm).render())
                    (Button::new("Medium").size(ButtonSize::Md).render())
                    (Button::new("Large").size(ButtonSize::Lg).render())
                    (Button::new("Full width").full_width().render())
                }
            },
            "Height is a token, and the smallest control is still 32px tall with a 44px hit area on touch."
        ))

        h2 { "States" }
        (demo(
            html! {
                div class="ui-row" {
                    (Button::new("Disabled").disabled(true).render())
                    (Button::new("Unavailable").aria_disabled(true).render())
                    (Button::new("Saving").loading(true).render())
                }
            },
            "The first is removed from the tab order and from screen readers. The second is focusable and announced as disabled, which is what you want when the reason matters. The third keeps its name and adds aria-busy."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "Renders a native <button>: role, Enter and Space all come from the platform.",
            "Defaults to type=\"button\", so it never submits a form it was not meant to submit.",
            "The accessible name is the visible label; there is no aria-label duplicating it.",
            "loading sets aria-busy=\"true\" and appends a visually hidden announcement after the label, so the name is unchanged while the state is announced.",
            "disabled writes the native attribute; aria_disabled writes aria-disabled=\"true\" and keeps the control focusable. Native disabled wins if both are set.",
            "The spinner is decorative: it is never the only signal that something is happening.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab / Shift+Tab", "Moves focus in and out of the button, unless it is natively disabled."),
            ("Enter", "Activates the button."),
            ("Space", "Activates the button on key release, matching native behaviour."),
        ]))

        h2 { "Markup" }
        p { "The output below is the library's own render, not a copy." }
        (code(&snippet))

        h2 { "Right to left" }
        p {
            "Nothing needs a special case: padding uses "
            code { "padding-inline" }
            ", and the label inherits the document direction."
        }
    }
}

fn icon_button_page() -> Markup {
    let snippet = IconButton::new("Next page", "›")
        .directional(true)
        .render()
        .into_string();

    html! {
        h1 { "Icon button" }
        p class="ui-lede" {
            "A square control whose only visible content is a glyph. The name is "
            "required by the constructor, because an icon button without a name is "
            "a button that does not exist for a screen reader."
        }

        h2 { "Names are not optional" }
        (demo(
            html! {
                div class="ui-row" {
                    (IconButton::new("Search", "⌕").render())
                    (IconButton::new("Delete item", "␡").variant(ButtonVariant::Danger).render())
                    (IconButton::new("Next page", "›").directional(true).render())
                    (IconButton::new("Settings", "⚙").variant(ButtonVariant::Ghost).render())
                }
            },
            "Each control has one accessible name and one decorative glyph. Hover them with a screen reader on and you hear the name, not the character."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "The accessible name is a visually hidden <span> inside the button, not an aria-label: it is part of the normal name computation and appears in the DOM for translators.",
            "The glyph carries aria-hidden=\"true\" so it is never announced, whatever the font does with it.",
            "The visible glyph must not be the name. '×' is announced as 'multiplication sign' at best.",
            "Directional glyphs (arrows, chevrons) get the ui-icon--directional class and mirror in RTL. A magnifier or a bin never does.",
            "The hit area is at least 44×44 CSS pixels, including on the small size.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab / Shift+Tab", "Reaches every icon button, including ghost variants inside rows."),
            ("Enter / Space", "Activates the button."),
        ]))

        h2 { "Markup" }
        (code(&snippet))

        h2 { "Right to left" }
        p {
            "The stylesheet flips directional glyphs with a single logical rule, "
            code { "[dir=\"rtl\"] .ui-icon--directional { scale: -1 1; }" }
            ". Non-directional glyphs are untouched, which is the distinction most "
            "icon systems get wrong."
        }
    }
}

fn text_input_page() -> Markup {
    let snippet = Input::new("email", "Email address", "email")
        .input_type(InputType::Email)
        .autocomplete("email")
        .description("We only use it to send sign-in links.")
        .required(true)
        .render()
        .into_string();

    html! {
        h1 { "Text input" }
        p class="ui-lede" {
            "A labelled input with an optional description and an optional error, "
            "wired together by the component. The three attributes that are always "
            "forgotten — for, aria-describedby and aria-invalid — are the whole point."
        }

        h2 { "Anatomy" }
        (demo(
            html! {
                div {
                    (Input::new("name", "Full name", "name")
                        .autocomplete("name")
                        .description("As it appears on your passport.")
                        .render())
                    (Input::new("email", "Email address", "email")
                        .input_type(InputType::Email)
                        .autocomplete("email")
                        .required(true)
                        .render())
                    (Input::new("password", "Password", "password")
                        .input_type(InputType::Password)
                        .autocomplete("current-password")
                        .error("Use at least 12 characters.")
                        .render())
                    (Input::new("token", "Access token", "token")
                        .dir(Direction::Ltr)
                        .description("Always written left to right, even on an Arabic page.")
                        .render())
                }
            },
            "Label, description, error. The fourth field forces dir=\"ltr\" on its value while the label stays in the page direction."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "The label is a real <label for>, not a placeholder and not a nearby div.",
            "The description gets an id and is referenced from aria-describedby, in reading order before the error.",
            "An error sets aria-invalid=\"true\" and is announced before its own text, so 'Use at least 12 characters' is not mistaken for help text.",
            "The required marker is aria-hidden; the requirement is announced through native `required` plus visually hidden words.",
            "dir can be overridden per field: an email address inside an Arabic page stays left to right without changing the page direction.",
            "Nothing here blocks paste, and nothing auto-submits.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab", "Moves between fields in visual order."),
            ("Enter", "Submits the form when the field is inside one."),
        ]))

        h2 { "Markup" }
        (code(&snippet))
    }
}

fn checkbox_page() -> Markup {
    let snippet = Checkbox::new("terms", "I accept the terms", "terms")
        .required(true)
        .render()
        .into_string();

    html! {
        h1 { "Checkbox" }
        p class="ui-lede" {
            "A real checkbox input. The only state HTML cannot express is "
            "indeterminate, and the component handles that the only honest way: by "
            "asking the small script to set the DOM flag."
        }

        h2 { "States" }
        (demo(
            html! {
                div {
                    (Checkbox::new("newsletter", "Send me the changelog", "newsletter")
                        .description("One email a month, no more.")
                        .render())
                    (Checkbox::new("remember", "Remember this device", "remember")
                        .checked(true)
                        .render())
                    (Checkbox::new("select-all", "Select all rows", "select_all")
                        .indeterminate(true)
                        .description("Mixed state, set through the DOM property.")
                        .render())
                    (Checkbox::new("terms", "I accept the terms", "terms")
                        .required(true)
                        .error("You must accept the terms to continue.")
                        .render())
                    (Checkbox::new("archived", "Include archived projects", "archived")
                        .disabled(true)
                        .render())
                }
            },
            "The label is part of the hit area, the error is linked with aria-describedby, and the mixed state is a real DOM property rather than a dash character."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "A native <input type=\"checkbox\">: Space toggles it and the form submits without JavaScript.",
            "The label is a <label for>, so clicking the words toggles the box and the name is announced.",
            "indeterminate is applied by setting the DOM property; the platform then reports 'mixed' by itself. It is never faked with a visual style.",
            "The error is referenced by aria-describedby and sets aria-invalid=\"true\".",
            "The required marker is aria-hidden; required itself is on the input.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab", "Moves to and from the checkbox."),
            ("Space", "Toggles it. Enter does nothing, by design: Enter submits forms."),
        ]))

        h2 { "Markup" }
        (code(&snippet))
    }
}

fn dialog_page() -> Markup {
    let snippet = Dialog::new(
        "delete-project",
        "Delete this project?",
        "Delete project",
        html! { p { "The project and its history are removed for everyone." } },
    )
    .render()
    .into_string();

    html! {
        h1 { "Dialog" }
        p class="ui-lede" {
            "A modal built on the native <dialog> element. The focus trap, the inert "
            "background, Escape and the top layer come from the platform; the "
            "component adds the naming, the close button and the focus return."
        }

        h2 { "Example" }
        (demo(
            html! {
                div class="ui-row" {
                    (Dialog::new(
                        "delete-project",
                        "Delete this project?",
                        "Delete project",
                        html! {
                            p { "The project and its history are removed for everyone. This cannot be undone." }
                            div class="ui-row" {
                                (Button::new("Delete").variant(ButtonVariant::Danger).render())
                                (Button::new("Cancel").variant(ButtonVariant::Secondary).render())
                            }
                        },
                    )
                    .description("This action cannot be undone.")
                    .render())
                }
            },
            "Tab cycles inside the dialog while it is open. Escape closes it and focus lands back on the trigger."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "A native <dialog> opened with showModal(): no div with role=\"dialog\", no hand-rolled focus trap.",
            "aria-labelledby points at the visible title; the dialog is never nameless.",
            "aria-describedby points at the supporting sentence when one is provided, so the consequence is heard before any button.",
            "The close button is an icon button with a real name, and it is the first thing in the header.",
            "Escape is the platform's own behaviour, so it works even if the script fails to load.",
            "Focus returns to the trigger when the dialog closes; nothing else on the page receives focus in the meantime.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab / Shift+Tab", "Cycles through the dialog's own controls: the background is inert."),
            ("Escape", "Closes the dialog without activating anything."),
            ("Enter / Space", "Activates the focused control as usual."),
        ]))

        h2 { "Markup" }
        (code(&snippet))

        h2 { "Note on the initial focus" }
        p {
            "The first focusable element receives focus, which for a destructive "
            "dialog is the wrong default. Until the component grows an explicit "
            "initial-focus option, put the safe action first in the DOM and give the "
            "destructive one an explicit "
            code { "autofocus" }
            " only when the action is reversible."
        }
    }
}

fn tabs_page() -> Markup {
    let snippet = Tabs::new(
        "project",
        "Project sections",
        vec![
            Tab::new("overview", "Overview", html! { p { "Overview panel." } }),
        ],
    )
    .render()
    .into_string();

    html! {
        h1 { "Tabs" }
        p class="ui-lede" {
            "ARIA tabs with one tab stop, direction-aware arrow keys and a fallback "
            "that keeps every panel readable without JavaScript. Tabs are for "
            "switching views, never for revealing content that only exists inside "
            "one panel."
        }

        h2 { "Horizontal" }
        (demo(
            html! {
                (Tabs::new(
                    "project",
                    "Project sections",
                    vec![
                        Tab::new(
                            "overview",
                            "Overview",
                            html! { p { "Everything about the project at a glance." } },
                        )
                        .selected(true),
                        Tab::new(
                            "activity",
                            "Activity",
                            html! { p { "A chronological list of changes." } },
                        ),
                        Tab::new(
                            "settings",
                            "Settings",
                            html! { p { "Names, access and destructive actions." } },
                        ),
                    ],
                )
                .render())
            },
            "Click, or Tab in and use the arrow keys. The tab list is a single tab stop."
        ))

        h2 { "Vertical" }
        (demo(
            html! {
                (Tabs::new(
                    "account",
                    "Account sections",
                    vec![
                        Tab::new("profile", "Profile", html! { p { "Name, photo, time zone." } })
                            .selected(true),
                        Tab::new("security", "Security", html! { p { "Passkeys and sessions." } }),
                        Tab::new("billing", "Billing", html! { p { "Invoices and payment method." } }),
                    ],
                )
                .orientation(TabsOrientation::Vertical)
                .render())
            },
            "Vertical tabs use Up and Down, and Home and End in both orientations."
        ))

        h2 { "ARIA contract" }
        (contract(&[
            "role=\"tablist\" with an accessible name, and aria-orientation matching the layout.",
            "Each tab is a real button with role=\"tab\", aria-selected, and aria-controls pointing at its panel.",
            "Each panel is role=\"tabpanel\" with aria-labelledby pointing back at its tab, and tabindex=\"0\" so it can be scrolled with the keyboard.",
            "Exactly one tab is in the tab order; the rest are reached with the arrow keys. The first tab is selected if none is marked.",
            "Arrow keys follow the reading direction: in RTL, ArrowRight moves to the previous tab.",
            "Inactive panels carry `hidden`, which the platform honours; a <noscript> rule un-hides them all when scripting is off.",
        ]))

        h2 { "Keyboard" }
        (keyboard(&[
            ("Tab / Shift+Tab", "Enters and leaves the tab list as one stop; the panel is the next stop."),
            ("ArrowRight / ArrowLeft", "Next and previous tab, mirrored in RTL."),
            ("ArrowUp / ArrowDown", "Next and previous tab, in the vertical orientation."),
            ("Home / End", "First and last tab."),
        ]))

        h2 { "Markup" }
        (code(&snippet))
    }
}

/// The whole gallery rendered in Arabic, right to left.
pub fn rtl_demo(ctx: &PageContext) -> Markup {
    let dir = arabic_direction();
    debug_assert_eq!(dir, Direction::Rtl);
    let mut arabic = ctx.clone();
    arabic.lang = String::from("ar");
    arabic.dir = dir;

    html! {
        h1 { "من اليمين إلى اليسار" }
        p class="ui-lede" {
            "هذه الصفحة تُعرض كاملة من اليمين إلى اليسار، بالمكوّنات نفسها وبملف الأنماط "
            "نفسه. لا توجد نسخة ثانية للأنماط، لأن كل الخصائص منطقية: "
        }
        code { "margin-inline" }
        " " code { "padding-block" } " " code { "inset-inline-start" }

        h2 { "أزرار" }
        (demo(
            html! {
                div class="ui-row" {
                    (Button::new("حفظ التغييرات").render())
                    (Button::new("إلغاء").variant(ButtonVariant::Secondary).render())
                    (Button::new("حذف").variant(ButtonVariant::Danger).render())
                    (Button::new("جارٍ الحفظ").loading(true).loading_label("جارٍ الحفظ").render())
                    (IconButton::new("الصفحة التالية", "‹").directional(true).render())
                }
            },
            "الاتجاه يتحدد من اللغة: السهم يتجه إلى اليسار في الواجهة العربية، والنص يتبعه.",
        ))

        h2 { "حقول" }
        (demo(
            html! {
                div {
                    (Input::new("name-ar", "الاسم الكامل", "name")
                        .description("كما يظهر في جواز السفر.")
                        .required(true)
                        .required_label("مطلوب")
                        .render())
                    (Input::new("email-ar", "البريد الإلكتروني", "email")
                        .input_type(InputType::Email)
                        .dir(Direction::Ltr)
                        .description("يُكتب دائمًا من اليسار إلى اليمين.")
                        .render())
                }
            },
            "التسمية بالعربية، وقيمة البريد الإلكتروني تُبقى من اليسار إلى اليمين.",
        ))

        h2 { "مربّعات اختيار" }
        (demo(
            html! {
                div {
                    (Checkbox::new("remember-ar", "تذكّر هذا الجهاز", "remember").checked(true).render())
                    (Checkbox::new("all-ar", "تحديد كل الصفوف", "select_all").indeterminate(true).render())
                }
            },
            "حالة التحديد الجزئي حقيقية، لا شرطة مرسومة.",
        ))

        h2 { "تبويبات" }
        (demo(
            html! {
                (Tabs::new(
                    "ar-tabs",
                    "أقسام المشروع",
                    vec![
                        Tab::new("ar-overview", "نظرة عامة", html! { p { "ملخص المشروع." } })
                            .selected(true),
                        Tab::new("ar-activity", "النشاط", html! { p { "قائمة التغييرات." } }),
                        Tab::new("ar-settings", "الإعدادات", html! { p { "الأسماء والصلاحيات." } }),
                    ],
                )
                .render())
            },
            "مفتاح السهم الأيمن ينتقل إلى التبويب السابق في الاتجاه العربي.",
        ))

        h2 { "نافذة حوار" }
        (demo(
            Dialog::new(
                "ar-dialog",
                "حذف هذا المشروع؟",
                "حذف المشروع",
                html! {
                    p { "سيُحذف المشروع وسجله بالكامل. لا يمكن التراجع عن هذا الإجراء." }
                },
            )
            .description("هذا الإجراء نهائي.")
            .close_label("إغلاق النافذة")
            .render(),
            "النافذة تُسمّى بعنوانها، وزر الإغلاق له اسم حقيقي.",
        ))

        h2 { "ما لا نفعله" }
        ul class="ui-contract" {
            li { "لا يوجد ملف أنماط منفصل للاتجاه العربي." }
            li { "لا تُقلب الأيقونات غير الاتجاهية، مثل العدسة أو سلة المهملات." }
            li { "لا تُستخدم خصائص CSS الفيزيائية مثل " code { "margin-left" } " في أي مكان في المكتبة." }
        }

        p {
            "للمقارنة: "
            a href=(arabic.lang_href("/", "en")) { "الصفحة الرئيسية بالإنجليزية" }
        }
    }
}

/// The 404 page.
pub fn not_found(ctx: &PageContext) -> Markup {
    html! {
        h1 { "Page not found" }
        p class="ui-lede" { "That component or page does not exist in this gallery." }
        p {
            "Try the "
            a href=(ctx.href("/")) { "overview" }
            " or the "
            a href=(ctx.href("/components/button")) { "component list" }
            "."
        }
    }
}
