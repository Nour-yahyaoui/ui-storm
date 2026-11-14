//! ui-storm — accessibility-first, RTL-native UI components for Rust.
//!
//! Components are plain server-rendered HTML built with Maud: no client
//! framework, no hydration, no build step. Behaviour that HTML cannot express
//! (modal dialogs, tab keyboard navigation, indeterminate checkboxes) is
//! layered on with a single progressive-enhancement script, so the markup is
//! the source of truth and JavaScript is an enhancement rather than a
//! requirement for content.
//!
//! Three rules shape the API:
//!
//! 1. **Names are required by construction.** [`components::Input`] cannot be
//!    rendered without a label, and [`components::IconButton`] cannot be
//!    rendered without an accessible name.
//! 2. **Direction is resolved once.** [`direction::locale_direction`] turns a
//!    BCP-47 tag into an [`direction::Direction`]; every page renders `dir` and
//!    `lang` on `<html>`, and CSS uses logical properties only.
//! 3. **Every claim has a test.** Contrast ratios are computed from the real
//!    stylesheet in [`tokens`], and the markup contracts are asserted in
//!    `tests/components.rs`.

#![forbid(unsafe_code)]

/// Re-exported so every consumer renders with the same Maud version.
pub use maud;

pub mod assets;
pub mod components;
pub mod direction;
pub mod tokens;

pub use components::{
    button::Button, button::ButtonKind, button::ButtonSize, button::ButtonVariant,
    checkbox::Checkbox, dialog::Dialog, field::Input, field::InputType, icon_button::IconButton,
    tabs::Tab, tabs::Tabs, tabs::TabsOrientation,
};
pub use direction::{Direction, locale_direction};
