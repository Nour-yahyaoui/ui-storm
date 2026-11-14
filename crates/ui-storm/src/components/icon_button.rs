//! Icon-only button: a square control whose accessible name is mandatory.

use maud::{html, Markup};

use super::button::{ButtonKind, ButtonSize, ButtonVariant};

/// A square button whose only visible content is a short glyph.
///
/// The name comes from visually hidden text inside the button rather than an
/// `aria-label`, so it participates in the same accessible-name computation as
/// every other button and cannot silently drift from visible text.
#[derive(Debug, Clone)]
pub struct IconButton<'a> {
    /// Accessible name, rendered visually hidden.
    pub label: &'a str,
    /// Visible glyph, hidden from assistive technology.
    pub glyph: &'a str,
    /// Size.
    pub size: ButtonSize,
    /// Visual weight.
    pub variant: ButtonVariant,
    /// HTML `type` attribute.
    pub kind: ButtonKind,
    /// Native `disabled`.
    pub disabled: bool,
    /// `aria-disabled`, keeps the button focusable.
    pub aria_disabled: bool,
    /// Optional element id.
    pub id: Option<&'a str>,
    /// Whether the glyph points somewhere (an arrow, a chevron) and must be
    /// mirrored in RTL. A magnifier or a bin must not be.
    pub directional: bool,
}

impl<'a> IconButton<'a> {
    /// Creates a secondary, medium icon button.
    pub fn new(label: &'a str, glyph: &'a str) -> Self {
        Self {
            label,
            glyph,
            size: ButtonSize::default(),
            variant: ButtonVariant::Secondary,
            kind: ButtonKind::Button,
            disabled: false,
            aria_disabled: false,
            id: None,
            directional: false,
        }
    }

    /// Sets the size.
    pub fn size(mut self, size: ButtonSize) -> Self {
        self.size = size;
        self
    }

    /// Sets the visual weight.
    pub fn variant(mut self, variant: ButtonVariant) -> Self {
        self.variant = variant;
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

    /// Sets the element id.
    pub fn id(mut self, id: &'a str) -> Self {
        self.id = Some(id);
        self
    }

    /// Marks the glyph as directional, so it mirrors in right-to-left layouts.
    pub fn directional(mut self, directional: bool) -> Self {
        self.directional = directional;
        self
    }

    /// Renders the button.
    pub fn render(&self) -> Markup {
        let mut classes = String::from("ui-button ui-icon-button");
        classes.push(' ');
        classes.push_str(self.variant.class());
        classes.push(' ');
        classes.push_str(self.size.class());

        let glyph_classes = if self.directional {
            "ui-icon-button__glyph ui-icon--directional"
        } else {
            "ui-icon-button__glyph"
        };

        let native_disabled = self.disabled;
        let aria_disabled = self.aria_disabled && !self.disabled;

        html! {
            button
                type=(self.kind.as_str())
                class=(classes.as_str())
                id=[self.id]
                disabled[native_disabled]
                aria-disabled=[aria_disabled.then_some("true")]
            {
                span class=(glyph_classes) aria-hidden="true" { (self.glyph) }
                span class="ui-visually-hidden" { (self.label) }
            }
        }
    }
}
