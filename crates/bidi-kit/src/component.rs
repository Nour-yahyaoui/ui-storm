//! The optional Dioxus layer.
//!
//! Nothing outside this module knows that Dioxus exists, which is why it is
//! behind a feature: a Maud template or an Actix handler needs the runs, not a
//! UI framework. What a framework adds is a place to put the runs, and that is
//! fifteen lines.
//!
//! The component exists because the alternative — loading the JavaScript bundle
//! and fixing the text after hydration — is a hydration mismatch waiting to
//! happen. Dioxus asks the server and the client for the same virtual DOM; a
//! `dir` decided by a `<script>` after the first paint is a `dir` the server did
//! not know about. Deciding in Rust means both sides agree by construction.

use dioxus::prelude::*;

use crate::segments;

/// Renders text as one `<bdi>` per direction run.
///
/// Each run is isolated, so a full stop after an Arabic name stays at the end of
/// the English sentence it belongs to, and a phone number inside Arabic keeps its
/// left-to-right shape. The base direction comes from the first strong character,
/// which is what `dir="auto"` would do — wrap the component in an element with an
/// explicit `dir` when the paragraph direction is already known.
///
/// ```ignore
/// use bidi_kit::MixedText;
///
/// rsx! {
///     p { dir: "ltr",
///         MixedText { text: String::from("Sent to أحمد this morning.") }
///     }
/// }
/// ```
#[allow(non_snake_case)]
#[component]
pub fn MixedText(text: String) -> Element {
    let runs = segments(&text, None);
    rsx! {
        for run in runs {
            bdi { dir: run.dir.as_str(), "{run.text}" }
        }
    }
}
