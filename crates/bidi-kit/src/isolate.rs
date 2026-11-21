//! Isolating text, in characters and in elements.

use crate::{segments, Direction};

/// Left-to-right isolate.
pub const LRI: char = '\u{2066}';
/// Right-to-left isolate.
pub const RLI: char = '\u{2067}';
/// First-strong isolate: the reader's bidi algorithm picks the direction.
pub const FSI: char = '\u{2068}';
/// Pop directional isolate.
pub const PDI: char = '\u{2069}';

/// Every character that can change the visual order without being visible.
pub const BIDI_CONTROL_CHARACTERS: [char; 12] = [
    '\u{061c}', '\u{200e}', '\u{200f}', '\u{202a}', '\u{202b}', '\u{202c}', '\u{202d}', '\u{202e}',
    '\u{2066}', '\u{2067}', '\u{2068}', '\u{2069}',
];

fn is_bidi_control(ch: char) -> bool {
    matches!(
        ch,
        '\u{061c}' | '\u{200e}' | '\u{200f}' | '\u{202a}'..='\u{202e}' | '\u{2066}'..='\u{2069}'
    )
}

/// Wraps text in an isolate, for plain-text contexts where an element is not an
/// option: an `aria-label`, a canvas, a terminal, a spreadsheet cell, a JSON
/// field that something else will render.
///
/// Pass `None` for the direction when the reader should decide — that is the
/// first-strong isolate, and the usual choice when the string came from a user.
///
/// In HTML, prefer [`crate::bdi_html`] or a `<bdi>` element: an element is
/// inspectable, stylable, and cannot leak a stray `PDI` when a string is
/// concatenated badly.
///
/// ```
/// use bidi_kit::{isolate, Direction, RLI, PDI};
///
/// assert_eq!(isolate("مرحبا", Some(Direction::Rtl)), format!("{RLI}مرحبا{PDI}"));
/// assert_eq!(isolate("", Some(Direction::Rtl)), "");
/// ```
#[must_use]
pub fn isolate(text: &str, dir: Option<Direction>) -> String {
    if text.is_empty() {
        return String::new();
    }
    let (open, close) = match dir {
        Some(Direction::Ltr) => (LRI, PDI),
        Some(Direction::Rtl) => (RLI, PDI),
        None => (FSI, PDI),
    };
    let mut isolated = String::with_capacity(text.len() + 2);
    isolated.push(open);
    isolated.push_str(text);
    isolated.push(close);
    isolated
}

/// True when the string carries invisible bidi control characters.
#[must_use]
pub fn has_bidi_controls(text: &str) -> bool {
    text.chars().any(is_bidi_control)
}

/// Removes every invisible bidi control character.
///
/// Use this on anything a stranger wrote. Overrides and isolates are the raw
/// material of display-spoofing bugs — the class of attack that turned source
/// code review into a guessing game — and a text field that passes them through
/// to a terminal, a diff or a filename is a bug, not a feature.
#[must_use]
pub fn strip_bidi_controls(text: &str) -> String {
    text.chars().filter(|ch| !is_bidi_control(*ch)).collect()
}

/// Rewrites text so each run is explicitly isolated, for plain-text output.
///
/// Unlike [`isolate`], which wraps the whole string, this keeps an English
/// sentence readable by a terminal that only understands the bidi algorithm: the
/// Arabic run gets an `RLI`/`PDI` pair and everything else is left alone.
#[must_use]
pub fn isolate_runs_text(text: &str) -> String {
    let mut isolated = String::with_capacity(text.len() + 8);
    for run in segments(text, None) {
        match run.dir {
            Direction::Ltr => isolated.push(LRI),
            Direction::Rtl => isolated.push(RLI),
        }
        isolated.push_str(run.text);
        isolated.push(PDI);
    }
    isolated
}

#[cfg(test)]
mod tests {
    use super::{
        has_bidi_controls, isolate, isolate_runs_text, strip_bidi_controls, LRI, RLI, PDI,
    };
    use crate::Direction;

    #[test]
    fn isolate_wraps_in_the_invisible_characters() {
        assert_eq!(
            isolate("مرحبا", Some(Direction::Rtl)),
            format!("{RLI}مرحبا{PDI}")
        );
        assert_eq!(isolate("hi", Some(Direction::Ltr)), format!("{LRI}hi{PDI}"));
        assert_eq!(isolate("hi", None), "\u{2068}hi\u{2069}");
        assert_eq!(isolate("", None), "");
    }

    #[test]
    fn isolate_runs_marks_each_run() {
        let isolated = isolate_runs_text("Hi أحمد");
        assert!(isolated.contains(&format!("{RLI}أحمد{PDI}")));
    }

    #[test]
    fn every_bidi_control_is_removed_and_nothing_else_is_touched() {
        let hostile = "report\u{202e}gnp.exe";
        assert!(has_bidi_controls(hostile));
        assert_eq!(strip_bidi_controls(hostile), "reportgnp.exe");
        assert!(!has_bidi_controls("مرحبا, hello."));
    }
}
