//! Server-rendered components.
//!
//! Each module exposes a props struct with a builder-style API and a
//! [`render`](Button::render) method returning [`maud::Markup`]. Rendering is
//! pure: no global state, no request access, no JavaScript required for the
//! markup to be correct.

pub mod button;
pub mod checkbox;
pub mod dialog;
pub mod field;
pub mod icon_button;
pub mod tabs;
