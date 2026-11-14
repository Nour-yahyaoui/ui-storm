//! Modal dialog built on the native `<dialog>` element.
//!
//! `showModal()` already gives a focus trap, an inert background, Escape
//! handling and top-layer stacking, so this component adds only the ARIA wiring
//! and the bits the platform leaves to authors: a named dialog, a described
//! dialog, a labelled close button, and focus returning to the trigger.

use maud::{html, Markup};

/// A modal dialog with its trigger.
#[derive(Debug, Clone)]
pub struct Dialog<'a> {
    /// Element id of the `<dialog>`.
    pub id: &'a str,
    /// Dialog title; names the dialog through `aria-labelledby`.
    pub title: &'a str,
    /// Optional supporting text, linked with `aria-describedby`.
    pub description: Option<&'a str>,
    /// Visible label of the trigger button.
    pub trigger_label: &'a str,
    /// Accessible name of the close button.
    pub close_label: &'a str,
    /// Whether to render the close button.
    pub dismissible: bool,
    /// Dialog contents.
    pub children: Markup,
}

impl<'a> Dialog<'a> {
    /// Creates a dismissible dialog with the given title and trigger.
    pub fn new(id: &'a str, title: &'a str, trigger_label: &'a str, children: Markup) -> Self {
        Self {
            id,
            title,
            description: None,
            trigger_label,
            close_label: "Close dialog",
            dismissible: true,
            children,
        }
    }

    /// Sets the supporting text.
    pub fn description(mut self, description: &'a str) -> Self {
        self.description = Some(description);
        self
    }

    /// Sets the close button label.
    pub fn close_label(mut self, close_label: &'a str) -> Self {
        self.close_label = close_label;
        self
    }

    /// Renders without a close button (Escape and the platform still work).
    pub fn without_close_button(mut self) -> Self {
        self.dismissible = false;
        self
    }

    /// Renders the trigger and the dialog.
    pub fn render(&self) -> Markup {
        let title_id = format!("{}-title", self.id);
        let description_id = self.description.map(|_| format!("{}-description", self.id));

        html! {
            button
                type="button"
                class="ui-button ui-button--secondary ui-button--md"
                data-ui-dialog-open=(self.id)
                aria-haspopup="dialog"
            {
                span class="ui-button__label" { (self.trigger_label) }
            }
            dialog
                id=(self.id)
                class="ui-dialog"
                aria-labelledby=(title_id.as_str())
                aria-describedby=[description_id.as_deref()]
            {
                div class="ui-dialog__panel" {
                    header class="ui-dialog__header" {
                        h2 class="ui-dialog__title" id=(title_id.as_str()) { (self.title) }
                        @if self.dismissible {
                            button
                                type="button"
                                class="ui-button ui-icon-button ui-button--ghost ui-button--md"
                                data-ui-dialog-close="true"
                            {
                                span class="ui-icon-button__glyph" aria-hidden="true" { "×" }
                                span class="ui-visually-hidden" { (self.close_label) }
                            }
                        }
                    }
                    @if let (Some(description), Some(description_id)) = (self.description, description_id.as_deref()) {
                        p class="ui-dialog__description" id=(description_id) { (description) }
                    }
                    div class="ui-dialog__body" { (self.children) }
                }
            }
        }
    }
}
