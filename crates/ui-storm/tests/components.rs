//! Markup contracts.
//!
//! These tests assert the HTML the accessibility claims depend on: the right
//! element, the right attributes, and relationships whose ids actually match.
//! They run on rendered output, not on sources, so a refactor cannot quietly
//! drop an attribute.

use std::collections::HashSet;

use ui_storm::{
    Button, ButtonSize, ButtonVariant, Checkbox, Dialog, Direction, IconButton, Input, InputType,
    Tab, Tabs, TabsOrientation,
};

/// Every value of a quoted attribute in `html`.
fn attr_values<'a>(html: &'a str, attribute: &str) -> Vec<&'a str> {
    let needle = format!("{attribute}=\"");
    let mut values = Vec::new();
    let mut rest = html;

    while let Some(position) = rest.find(&needle) {
        let after = &rest[position + needle.len()..];
        match after.find('"') {
            Some(end) => {
                values.push(&after[..end]);
                rest = &after[end + 1..];
            }
            None => break,
        }
    }

    values
}

fn page_of(markup: &[String]) -> String {
    markup.join("\n")
}

#[test]
fn button_renders_a_native_button_with_a_safe_type() {
    let html = Button::new("Save").render().into_string();

    assert!(html.starts_with("<button"), "got {html}");
    assert!(html.contains("type=\"button\""), "got {html}");
    assert!(html.contains("class=\"ui-button ui-button--primary ui-button--md\""));
    assert!(html.contains(">Save<"));
    // A label is text, not an aria-label.
    assert!(!html.contains("aria-label"), "got {html}");
}

#[test]
fn button_variants_and_sizes_are_class_tokens() {
    for (variant, class) in [
        (ButtonVariant::Primary, "ui-button--primary"),
        (ButtonVariant::Secondary, "ui-button--secondary"),
        (ButtonVariant::Ghost, "ui-button--ghost"),
        (ButtonVariant::Danger, "ui-button--danger"),
    ] {
        let html = Button::new("x").variant(variant).render().into_string();
        assert!(html.contains(class), "{variant:?} missing {class}: {html}");
    }

    for (size, class) in [
        (ButtonSize::Sm, "ui-button--sm"),
        (ButtonSize::Md, "ui-button--md"),
        (ButtonSize::Lg, "ui-button--lg"),
    ] {
        let html = Button::new("x").size(size).render().into_string();
        assert!(html.contains(class), "{size:?} missing {class}: {html}");
    }
}

#[test]
fn button_native_disabled_removes_it_from_the_page() {
    let html = Button::new("x").disabled(true).render().into_string();
    assert!(html.contains(" disabled"), "got {html}");
    // Native disabled already means "unavailable"; aria-disabled would be redundant.
    assert!(!html.contains("aria-disabled"), "got {html}");
}

#[test]
fn button_aria_disabled_stays_focusable() {
    let html = Button::new("x").aria_disabled(true).render().into_string();
    assert!(html.contains("aria-disabled=\"true\""), "got {html}");
    assert!(!html.contains(" disabled"), "got {html}");
}

#[test]
fn native_disabled_wins_over_aria_disabled() {
    let html = Button::new("x")
        .disabled(true)
        .aria_disabled(true)
        .render()
        .into_string();
    assert!(html.contains(" disabled"), "got {html}");
    assert!(!html.contains("aria-disabled"), "got {html}");
}

#[test]
fn button_loading_sets_aria_busy_without_renaming_the_button() {
    let html = Button::new("Saving the draft")
        .loading(true)
        .render()
        .into_string();

    assert!(html.contains("aria-busy=\"true\""), "got {html}");
    assert!(html.contains("is-loading"), "got {html}");
    // The name is still the visible label; the announcement is additive.
    assert!(html.contains(">Saving the draft<"), "got {html}");
    assert!(html.contains("ui-visually-hidden"), "got {html}");
}

#[test]
fn button_escapes_labels() {
    let html = Button::new("<script>alert(1)</script>").render().into_string();
    assert!(!html.contains("<script>"), "got {html}");
    assert!(html.contains("&lt;script&gt;"), "got {html}");
}

#[test]
fn icon_button_always_carries_a_name_and_a_decorative_glyph() {
    let html = IconButton::new("Close dialog", "×").render().into_string();

    assert!(html.contains("ui-icon-button"), "got {html}");
    assert!(html.contains("aria-hidden=\"true\""), "got {html}");
    assert!(html.contains("<span class=\"ui-visually-hidden\">Close dialog</span>"));
    // The glyph must never be the accessible name.
    assert!(!html.contains("aria-label"), "got {html}");
}

#[test]
fn icon_button_mirrors_only_directional_glyphs() {
    let forward = IconButton::new("Next", "›").directional(true).render().into_string();
    let search = IconButton::new("Search", "⌕").render().into_string();

    assert!(
        forward.contains("ui-icon-button__glyph ui-icon--directional"),
        "got {forward}"
    );
    assert!(
        !search.contains("ui-icon--directional"),
        "a magnifier must not be mirrored: {search}"
    );
}

#[test]
fn input_wires_label_description_and_error_together() {
    let html = Input::new("email", "Email address", "email")
        .input_type(InputType::Email)
        .description("We only use it to send sign-in links.")
        .error("Enter a valid email address.")
        .render()
        .into_string();

    assert!(html.contains("label class=\"ui-field__label\" for=\"email\""), "got {html}");
    assert!(html.contains("id=\"email\""), "got {html}");
    assert!(html.contains("name=\"email\""), "got {html}");
    assert!(html.contains("type=\"email\""), "got {html}");
    assert!(html.contains("id=\"email-description\""), "got {html}");
    assert!(html.contains("id=\"email-error\""), "got {html}");
    // Description first, then the error: reading order matches announcement order.
    assert!(
        html.contains("aria-describedby=\"email-description email-error\""),
        "got {html}"
    );
    assert!(html.contains("aria-invalid=\"true\""), "got {html}");
}

#[test]
fn input_without_description_or_error_has_no_dangling_references() {
    let html = Input::new("name", "Name", "name").render().into_string();

    assert!(!html.contains("aria-describedby"), "got {html}");
    assert!(!html.contains("aria-invalid"), "got {html}");
    assert!(!html.contains("ui-field__error"), "got {html}");
}

#[test]
fn input_can_force_direction_for_the_value_only() {
    let html = Input::new("email", "البريد الإلكتروني", "email")
        .dir(Direction::Ltr)
        .render()
        .into_string();

    assert!(html.contains("dir=\"ltr\""), "got {html}");
    // The label is not forced: it inherits the page direction.
    assert_eq!(attr_values(&html, "dir"), vec!["ltr"]);
}

#[test]
fn required_input_announces_the_requirement_in_words() {
    let html = Input::new("email", "Email", "email")
        .required(true)
        .required_label("required")
        .render()
        .into_string();

    assert!(html.contains(" required"), "got {html}");
    assert!(html.contains("aria-hidden=\"true\""), "got {html}");
    assert!(html.contains("<span class=\"ui-visually-hidden\"> required</span>"), "got {html}");
}

#[test]
fn checkbox_is_a_native_input_with_a_real_label() {
    let html = Checkbox::new("terms", "I accept", "terms").render().into_string();

    assert!(html.contains("type=\"checkbox\""), "got {html}");
    assert!(html.contains("class=\"ui-checkbox__input\""), "got {html}");
    assert!(html.contains("label class=\"ui-checkbox__label\" for=\"terms\""), "got {html}");
    assert!(!html.contains("role=\"checkbox\""), "never fake the role: {html}");
}

#[test]
fn checkbox_checked_and_disabled_follow_the_dom() {
    let checked = Checkbox::new("a", "A", "a").checked(true).render().into_string();
    assert!(checked.contains(" checked"), "got {checked}");

    let disabled = Checkbox::new("a", "A", "a").disabled(true).render().into_string();
    assert!(disabled.contains(" disabled"), "got {disabled}");
}

#[test]
fn checkbox_indeterminate_is_flagged_for_the_script() {
    let html = Checkbox::new("all", "Select all", "all")
        .indeterminate(true)
        .render()
        .into_string();

    assert!(html.contains("data-ui-indeterminate=\"true\""), "got {html}");
    // aria-checked="mixed" on a native checkbox is redundant and discouraged.
    assert!(!html.contains("aria-checked"), "got {html}");
}

#[test]
fn dialog_is_named_by_its_title_and_has_a_named_close_button() {
    let html = Dialog::new("confirm", "Delete project", "Delete", ui_storm::maud::html! { p { "Body" } })
        .description("This cannot be undone.")
        .render()
        .into_string();

    assert!(html.contains("<dialog"), "got {html}");
    assert!(html.contains("aria-labelledby=\"confirm-title\""), "got {html}");
    assert!(html.contains("id=\"confirm-title\""), "got {html}");
    assert!(html.contains("aria-describedby=\"confirm-description\""), "got {html}");
    assert!(html.contains("data-ui-dialog-open=\"confirm\""), "got {html}");
    assert!(html.contains("aria-haspopup=\"dialog\""), "got {html}");
    assert!(
        html.contains("<span class=\"ui-visually-hidden\">Close dialog</span>"),
        "the close button needs a name: {html}"
    );
    assert!(!html.contains("role=\"dialog\""), "the element already has the role: {html}");
}

#[test]
fn dialog_can_be_rendered_without_a_close_button() {
    let html = Dialog::new("x", "Title", "Open", ui_storm::maud::html! { p { "Body" } })
        .without_close_button()
        .render()
        .into_string();

    assert!(!html.contains("data-ui-dialog-close"), "got {html}");
    assert!(html.contains("aria-labelledby"), "still named: {html}");
}

fn tabs_example() -> Tabs<'static> {
    Tabs::new(
        "project",
        "Project sections",
        vec![
            Tab::new("overview", "Overview", ui_storm::maud::html! { p { "One" } }).selected(true),
            Tab::new("activity", "Activity", ui_storm::maud::html! { p { "Two" } }),
            Tab::new("settings", "Settings", ui_storm::maud::html! { p { "Three" } }),
        ],
    )
}

#[test]
fn tabs_have_exactly_one_tab_stop() {
    let html = tabs_example().render().into_string();
    let tabindexes = attr_values(&html, "tabindex");

    // Three tabs, exactly one of them in the tab order; three panels, each
    // focusable so it can be scrolled from the keyboard.
    assert_eq!(
        tabindexes.iter().filter(|value| **value == "0").count(),
        4,
        "one tab plus three panels: {html}"
    );
    assert_eq!(
        tabindexes.iter().filter(|value| **value == "-1").count(),
        2,
        "the inactive tabs: {html}"
    );
}

#[test]
fn tabs_link_tabs_and_panels_in_both_directions() {
    let html = tabs_example().render().into_string();
    let controls = attr_values(&html, "aria-controls");
    let labelled_by = attr_values(&html, "aria-labelledby");
    let ids: HashSet<&str> = attr_values(&html, "id").into_iter().collect();

    assert_eq!(controls.len(), 3, "got {html}");
    for id in controls.iter().chain(labelled_by.iter()) {
        assert!(ids.contains(id), "{id} is referenced but not defined: {html}");
    }
    assert_eq!(labelled_by.len(), 3);
    // Orientation is declared, not implied.
    assert!(html.contains("aria-orientation=\"horizontal\""), "got {html}");
}

#[test]
fn tabs_select_the_first_tab_when_none_is_marked() {
    let tabs = Tabs::new(
        "x",
        "Sections",
        vec![
            Tab::new("one", "One", ui_storm::maud::html! { p { "a" } }),
            Tab::new("two", "Two", ui_storm::maud::html! { p { "b" } }),
        ],
    );
    let html = tabs.render().into_string();

    assert_eq!(attr_values(&html, "aria-selected"), vec!["true", "false"]);
    assert!(html.contains("<section class=\"ui-tabs__panel\" role=\"tabpanel\" id=\"one-panel\""), "got {html}");
    assert!(html.contains(" hidden"), "the inactive panel is hidden: {html}");
}

#[test]
fn vertical_tabs_declare_their_orientation() {
    let html = tabs_example()
        .orientation(TabsOrientation::Vertical)
        .render()
        .into_string();

    assert!(html.contains("aria-orientation=\"vertical\""), "got {html}");
    assert!(html.contains("data-ui-tabs-orientation=\"vertical\""), "got {html}");
}

#[test]
fn ids_are_unique_across_a_full_page() {
    let markup = vec![
        Button::new("Save").id("save").render().into_string(),
        IconButton::new("Search", "⌕").render().into_string(),
        Input::new("email", "Email", "email")
            .description("Helper")
            .error("Bad")
            .render()
            .into_string(),
        Checkbox::new("terms", "Terms", "terms").render().into_string(),
        Dialog::new("confirm", "Title", "Open", ui_storm::maud::html! { p { "Body" } })
            .description("Body")
            .render()
            .into_string(),
        tabs_example().render().into_string(),
    ];
    let page = page_of(&markup);
    let ids = attr_values(&page, "id");

    assert!(!ids.is_empty());
    let unique: HashSet<&&str> = ids.iter().collect();
    assert_eq!(unique.len(), ids.len(), "duplicate ids in {page}");
}

#[test]
fn no_component_ships_physical_direction_markup() {
    let page = page_of(&[
        Button::new("Save").full_width().render().into_string(),
        Input::new("a", "A", "a").render().into_string(),
        tabs_example().render().into_string(),
    ]);

    for physical in ["margin-left", "padding-left", "text-align:left", "float:left"] {
        assert!(!page.contains(physical), "{physical} in {page}");
    }
}
