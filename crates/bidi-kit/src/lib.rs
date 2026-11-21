//! Bidirectional text for Rust: where a sentence changes direction, and how to
//! isolate the pieces.
//!
//! This is the Rust half of [`bidi-kit`](https://www.npmjs.com/package/bidi-kit),
//! answering the same question with the same rules:
//!
//! > The browser implements the Unicode bidirectional algorithm correctly. What
//! > it cannot know is where the author meant a boundary to be.
//!
//! A plain `dir="rtl"` sets the direction of a block and then lets the algorithm
//! order everything inside it per character. Punctuation and digits are neutral,
//! so they take their direction from their neighbours — which is why an English
//! full stop after an Arabic name lands on the wrong side of it, and why
//! `+216 71 123 456` comes apart inside an Arabic sentence.
//!
//! ```
//! use bidi_kit::{segments, Direction};
//!
//! let runs = segments("الهاتف: +216 71 123 456", None);
//! assert_eq!(runs[0].dir, Direction::Rtl);
//! assert_eq!(runs[1].text, "216 71 123 456");
//! assert_eq!(runs[1].dir, Direction::Ltr);
//! ```
//!
//! # Using it in Dioxus
//!
//! With the `dioxus` feature there is a component that renders one `<bdi>` per
//! run, which is the whole job:
//!
//! ```ignore
//! use bidi_kit::MixedText;
//!
//! rsx! { p { MixedText { text: "Sent to أحمد this morning." } } }
//! ```
//!
//! The same information is available without the feature — call [`segments`] and
//! build the elements yourself — which is what you want in Maud, in an Actix
//! handler, or anywhere that is not Dioxus.
//!
//! # Differences from the JavaScript package
//!
//! Two, both deliberate:
//!
//! - **Offsets are byte offsets, not UTF-16 indices.** [`Segment::start`] and
//!   [`Segment::end`] index the UTF-8 string, so `&text[run.start..run.end]`
//!   always compiles and always is the run. For Arabic this is usually the same
//!   number as JavaScript reports; for any character outside the basic plane —
//!   Arabic mathematical alphabetic symbols, for instance — it is not.
//! - **[`detect_direction`] returns `Option<Direction>`.** JavaScript returns the
//!   string `"neutral"`, which is a third case pretending to be a direction.
//!   [`resolve_direction`] is the version that always answers, and is what HTML
//!   does with `dir="auto"`.
//!
//! Everything else — the class table, the numeric joiner rules, the base
//! direction fallback, the isolate characters — is the same, and
//! `tests/corpus.rs` reads the same fixture file as the npm package to keep it
//! that way.
#![forbid(unsafe_code)]

mod class;
mod direction;
mod html;
mod isolate;
mod segment;
mod tables;

#[cfg(feature = "dioxus")]
mod component;

pub use crate::direction::Direction;
pub use crate::html::{bdi_html, escape_html, inline_html, paragraph_html, HtmlOptions, Part};
pub use crate::isolate::{
    has_bidi_controls, isolate, isolate_runs_text, strip_bidi_controls, BIDI_CONTROL_CHARACTERS,
    FSI, LRI, PDI, RLI,
};
pub use crate::class::{has_arabic, has_rtl};
pub use crate::segment::{detect_direction, resolve_direction, segments, Segment};

#[cfg(feature = "dioxus")]
pub use crate::component::MixedText;
