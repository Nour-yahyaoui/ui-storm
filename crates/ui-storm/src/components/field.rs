//! Labelled text input.
//!
//! The component wires `label[for]`, `aria-describedby` and `aria-invalid`
//! itself, because those are exactly the connections that get forgotten when a
//! control is assembled by hand.

use maud::{html, Markup};

use crate::direction::Direction;

/// The HTML `type` attribute for text-like inputs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum InputType {
    #[default]
    Text,
    Email,
    Tel,
    Url,
    Password,
    Search,
    Number,
}

impl InputType {
    /// The value written to the `type` attribute.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::Email => "email",
            Self::Tel => "tel",
            Self::Url => "url",
            Self::Password => "password",
            Self::Search => "search",
            Self::Number => "number",
        }
    }
}

/// A text input with a label, an optional description and an optional error.
///
/// An [`Input`] cannot be rendered without a label: the field is required at
/// the type level, not by convention.
#[derive(Debug, Clone)]
pub struct Input<'a> {
    /// Element id; also the anchor for the label and the error message.
    pub id: &'a str,
    /// Visible label and accessible name.
    pub label: &'a str,
    /// Form field name.
    pub name: &'a str,
    /// Input type.
    pub input_type: InputType,
    /// Current value.
    pub value: Option<&'a str>,
    /// Helper text, linked with `aria-describedby`.
    pub description: Option<&'a str>,
    /// Error text. Presence sets `aria-invalid="true"`.
    pub error: Option<&'a str>,
    /// Marks the field as required.
    pub required: bool,
    /// Native `disabled`.
    pub disabled: bool,
    /// Native `readonly`.
    pub readonly: bool,
    /// A valid HTML `autocomplete` token.
    pub autocomplete: Option<&'a str>,
    /// Placeholder. Never a substitute for the label.
    pub placeholder: Option<&'a str>,
    /// Forces a direction, e.g. `ltr` for an email field inside an Arabic page.
    pub dir: Option<Direction>,
    /// Announced after the visible label when the field is required.
    pub required_label: &'a str,
    /// Prefix announced before the error text.
    pub error_label: &'a str,
}

impl<'a> Input<'a> {
    /// Creates a text input. `id`, `label` and `name` are mandatory.
    pub fn new(id: &'a str, label: &'a str, name: &'a str) -> Self {
        Self {
            id,
            label,
            name,
            input_type: InputType::default(),
            value: None,
            description: None,
            error: None,
            required: false,
            disabled: false,
            readonly: false,
            autocomplete: None,
            placeholder: None,
            dir: None,
            required_label: "(required)",
            error_label: "Error:",
        }
    }

    /// Sets the input type.
    pub fn input_type(mut self, input_type: InputType) -> Self {
        self.input_type = input_type;
        self
    }

    /// Sets the current value.
    pub fn value(mut self, value: &'a str) -> Self {
        self.value = Some(value);
        self
    }

    /// Adds helper text.
    pub fn description(mut self, description: &'a str) -> Self {
        self.description = Some(description);
        self
    }

    /// Adds an error message and marks the field invalid.
    pub fn error(mut self, error: &'a str) -> Self {
        self.error = Some(error);
        self
    }

    /// Marks the field as required.
    pub fn required(mut self, required: bool) -> Self {
        self.required = required;
        self
    }

    /// Disables the input natively.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Marks the input readonly.
    pub fn readonly(mut self, readonly: bool) -> Self {
        self.readonly = readonly;
        self
    }

    /// Sets an `autocomplete` token.
    pub fn autocomplete(mut self, autocomplete: &'a str) -> Self {
        self.autocomplete = Some(autocomplete);
        self
    }

    /// Sets a placeholder (never a substitute for the label).
    pub fn placeholder(mut self, placeholder: &'a str) -> Self {
        self.placeholder = Some(placeholder);
        self
    }

    /// Forces a writing direction for the value.
    pub fn dir(mut self, dir: Direction) -> Self {
        self.dir = Some(dir);
        self
    }

    /// Overrides the required announcement.
    pub fn required_label(mut self, label: &'a str) -> Self {
        self.required_label = label;
        self
    }

    /// Overrides the error announcement prefix.
    pub fn error_label(mut self, label: &'a str) -> Self {
        self.error_label = label;
        self
    }

    /// Renders the field.
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

        let aria_invalid = self.error.map(|_| "true");

        html! {
            div class="ui-field" {
                label class="ui-field__label" for=(self.id) {
                    (self.label)
                    @if self.required {
                        span class="ui-field__required" aria-hidden="true" { "*" }
                        span class="ui-visually-hidden" { (" ")(self.required_label) }
                    }
                }
                @if let (Some(description), Some(description_id)) = (self.description, description_id.as_deref()) {
                    p class="ui-field__description" id=(description_id) { (description) }
                }
                input
                    class="ui-input"
                    id=(self.id)
                    name=(self.name)
                    type=(self.input_type.as_str())
                    value=[self.value]
                    placeholder=[self.placeholder]
                    autocomplete=[self.autocomplete]
                    dir=[self.dir.map(|direction| direction.as_str())]
                    required[self.required]
                    disabled[self.disabled]
                    readonly[self.readonly]
                    aria-invalid=[aria_invalid]
                    aria-describedby=[described_by.as_deref()];
                @if let (Some(error), Some(error_id)) = (self.error, error_id.as_deref()) {
                    p class="ui-field__error" id=(error_id) {
                        span class="ui-visually-hidden" { (self.error_label)(" ") }
                        (error)
                    }
                }
            }
        }
    }
}
