//! Button — the reference implementation for every component convention.

use maud::{html, Markup};

/// Visual weight of a button.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonVariant {
    #[default]
    Primary,
    Secondary,
    Ghost,
    Danger,
}

impl ButtonVariant {
    /// Class name for the variant.
    pub const fn class(self) -> &'static str {
        match self {
            Self::Primary => "ui-button--primary",
            Self::Secondary => "ui-button--secondary",
            Self::Ghost => "ui-button--ghost",
            Self::Danger => "ui-button--danger",
        }
    }
}

/// Control size. Every size keeps the target at least 44×44 CSS pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonSize {
    Sm,
    #[default]
    Md,
    Lg,
}

impl ButtonSize {
    /// Class name for the size.
    pub const fn class(self) -> &'static str {
        match self {
            Self::Sm => "ui-button--sm",
            Self::Md => "ui-button--md",
            Self::Lg => "ui-button--lg",
        }
    }
}

/// The HTML `type` attribute.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonKind {
    #[default]
    Button,
    Submit,
    Reset,
}

impl ButtonKind {
    /// The value written to the `type` attribute.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Button => "button",
            Self::Submit => "submit",
            Self::Reset => "reset",
        }
    }
}

/// A native `<button>`.
///
/// Two ways to express unavailability, with different consequences:
///
/// - [`Button::disabled`] writes the native `disabled` attribute. The button is
///   removed from the tab order and from screen-reader discovery — correct for
///   submit controls that must not fire.
/// - [`Button::aria_disabled`] writes `aria-disabled="true"` and keeps the
///   button focusable — correct for actions whose existence should still be
///   discoverable.
///
/// Native `disabled` wins if both are set.
#[derive(Debug, Clone)]
pub struct Button<'a> {
    /// Visible label. Also the accessible name.
    pub label: &'a str,
    /// Visual weight.
    pub variant: ButtonVariant,
    /// Size.
    pub size: ButtonSize,
    /// HTML `type` attribute.
    pub kind: ButtonKind,
    /// Shows a spinner and sets `aria-busy="true"`.
    pub loading: bool,
    /// Native `disabled`.
    pub disabled: bool,
    /// `aria-disabled`, keeps the button focusable.
    pub aria_disabled: bool,
    /// Stretch to the full inline size of the container.
    pub full_width: bool,
    /// Announced while loading, appended after the label.
    pub loading_label: &'a str,
    /// Optional element id.
    pub id: Option<&'a str>,
}

impl<'a> Button<'a> {
    /// Creates a primary, medium, `type="button"` button.
    pub fn new(label: &'a str) -> Self {
        Self {
            label,
            variant: ButtonVariant::default(),
            size: ButtonSize::default(),
            kind: ButtonKind::default(),
            loading: false,
            disabled: false,
            aria_disabled: false,
            full_width: false,
            loading_label: "Loading",
            id: None,
        }
    }

    /// Sets the visual weight.
    pub fn variant(mut self, variant: ButtonVariant) -> Self {
        self.variant = variant;
        self
    }

    /// Sets the size.
    pub fn size(mut self, size: ButtonSize) -> Self {
        self.size = size;
        self
    }

    /// Sets the HTML `type` attribute.
    pub fn kind(mut self, kind: ButtonKind) -> Self {
        self.kind = kind;
        self
    }

    /// Shows a loading state without changing the accessible name.
    pub fn loading(mut self, loading: bool) -> Self {
        self.loading = loading;
        self
    }

    /// Uses the native `disabled` attribute.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Uses `aria-disabled` and keeps the button focusable.
    pub fn aria_disabled(mut self, aria_disabled: bool) -> Self {
        self.aria_disabled = aria_disabled;
        self
    }

    /// Stretches the button to the container width.
    pub fn full_width(mut self) -> Self {
        self.full_width = true;
        self
    }

    /// Customises the loading announcement.
    pub fn loading_label(mut self, loading_label: &'a str) -> Self {
        self.loading_label = loading_label;
        self
    }

    /// Sets the element id.
    pub fn id(mut self, id: &'a str) -> Self {
        self.id = Some(id);
        self
    }

    /// Renders the button.
    pub fn render(&self) -> Markup {
        let mut classes = String::from("ui-button");
        classes.push(' ');
        classes.push_str(self.variant.class());
        classes.push(' ');
        classes.push_str(self.size.class());
        if self.full_width {
            classes.push_str(" ui-button--full");
        }
        if self.loading {
            classes.push_str(" is-loading");
        }

        let native_disabled = self.disabled;
        let aria_disabled = self.aria_disabled && !self.disabled;

        html! {
            button
                type=(self.kind.as_str())
                class=(classes.as_str())
                id=[self.id]
                disabled[native_disabled]
                aria-disabled=[aria_disabled.then_some("true")]
                aria-busy=[self.loading.then_some("true")]
            {
                span class="ui-button__label" { (self.label) }
                @if self.loading {
                    span class="ui-visually-hidden" { (" ")(self.loading_label) }
                }
            }
        }
    }
}
