//! Checkbox — a native checkbox input, styled but never replaced.

use maud::{html, Markup};

/// A labelled checkbox.
///
/// The control is a real `<input type="checkbox">`: Space toggles it, the label
/// activates it, and form submission needs no JavaScript. The indeterminate
/// state is the one thing HTML cannot express declaratively, so it is written as
/// `data-ui-indeterminate="true"`; the enhancement script sets the DOM
/// `indeterminate` flag, which the platform already exposes as "mixed" to
/// assistive technology. Never fake it with a visual style alone.
#[derive(Debug, Clone)]
pub struct Checkbox<'a> {
    /// Element id, used by the label.
    pub id: &'a str,
    /// Visible label.
    pub label: &'a str,
    /// Form field name.
    pub name: &'a str,
    /// Submitted value.
    pub value: Option<&'a str>,
    /// Checked state.
    pub checked: bool,
    /// Requests the mixed state (needs the enhancement script).
    pub indeterminate: bool,
    /// Helper text.
    pub description: Option<&'a str>,
    /// Error text.
    pub error: Option<&'a str>,
    /// Marks the checkbox required.
    pub required: bool,
    /// Native `disabled`.
    pub disabled: bool,
    /// Announced after the label when required.
    pub required_label: &'a str,
}

impl<'a> Checkbox<'a> {
    /// Creates an unchecked checkbox.
    pub fn new(id: &'a str, label: &'a str, name: &'a str) -> Self {
        Self {
            id,
            label,
            name,
            value: None,
            checked: false,
            indeterminate: false,
            description: None,
            error: None,
            required: false,
            disabled: false,
            required_label: "(required)",
        }
    }

    /// Sets the checked state.
    pub fn checked(mut self, checked: bool) -> Self {
        self.checked = checked;
        self
    }

    /// Requests the mixed state.
    pub fn indeterminate(mut self, indeterminate: bool) -> Self {
        self.indeterminate = indeterminate;
        self
    }

    /// Sets the submitted value.
    pub fn value(mut self, value: &'a str) -> Self {
        self.value = Some(value);
        self
    }

    /// Adds helper text.
    pub fn description(mut self, description: &'a str) -> Self {
        self.description = Some(description);
        self
    }

    /// Adds an error message.
    pub fn error(mut self, error: &'a str) -> Self {
        self.error = Some(error);
        self
    }

    /// Marks the checkbox required.
    pub fn required(mut self, required: bool) -> Self {
        self.required = required;
        self
    }

    /// Disables the checkbox natively.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Overrides the required announcement.
    pub fn required_label(mut self, label: &'a str) -> Self {
        self.required_label = label;
        self
    }

    /// Renders the checkbox.
    pub fn render(&self) -> Markup {
        let description_id = self
            .description
            .map(|_| format!("{}-description", self.id));
        let error_id = self.error.map(|_| format!("{}-error", self.id));

        let mut described_by: Vec<&str> = Vec::new();
        if let Some(id) = description_id.as_deref() {
            described_by.push(id);
        }
        if let Some(id) = error_id.as_deref() {
            described_by.push(id);
        }
        let described_by = if described_by.is_empty() {
            None
        } else {
            Some(described_by.join(" "))
        };

        html! {
            div class="ui-field ui-checkbox" {
                div class="ui-checkbox__control" {
                    input
                        class="ui-checkbox__input"
                        type="checkbox"
                        id=(self.id)
                        name=(self.name)
                        value=[self.value]
                        checked[self.checked]
                        required[self.required]
                        disabled[self.disabled]
                        aria-invalid=[self.error.map(|_| "true")]
                        aria-describedby=[described_by.as_deref()]
                        data-ui-indeterminate=[self.indeterminate.then_some("true")];
                    label class="ui-checkbox__label" for=(self.id) {
                        (self.label)
                        @if self.required {
                            span class="ui-field__required" aria-hidden="true" { "*" }
                            span class="ui-visually-hidden" { (" ")(self.required_label) }
                        }
                    }
                }
                @if let (Some(description), Some(description_id)) = (self.description, description_id.as_deref()) {
                    p class="ui-field__description" id=(description_id) { (description) }
                }
                @if let (Some(error), Some(error_id)) = (self.error, error_id.as_deref()) {
                    p class="ui-field__error" id=(error_id) { (error) }
                }
            }
        }
    }
}
