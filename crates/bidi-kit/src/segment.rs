//! Splitting text into runs that each have one direction.

use crate::class::{base_class, class_at, CharClass};
use crate::Direction;

/// One run of text, and the direction it reads in.
///
/// `start` and `end` are **byte** offsets into the string that was segmented, so
/// `&text[run.start..run.end] == run.text` always holds. The JavaScript package
/// reports UTF-16 indices instead; the two agree for every character in the
/// basic multilingual plane, which is all of Arabic, Hebrew and their
/// punctuation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Segment<'a> {
    /// The run's text, borrowed from the string that was segmented.
    pub text: &'a str,
    /// The direction this run reads in.
    pub dir: Direction,
    /// Byte offset of the first character.
    pub start: usize,
    /// Byte offset one past the last character.
    pub end: usize,
}

impl Segment<'_> {
    /// Whether this run reads right to left.
    #[must_use]
    pub fn is_rtl(&self) -> bool {
        self.dir.is_rtl()
    }
}

/// A run before neutral runs have been given a direction.
#[derive(Debug, Clone, Copy)]
struct Draft {
    start: usize,
    end: usize,
    dir: Option<Direction>,
}

/// Splits text into runs that each have one direction.
///
/// The browser implements the Unicode bidirectional algorithm correctly; what it
/// cannot know is where the author meant a boundary to be. This answers that
/// question, and nothing else:
///
/// - a strong character starts a run and decides its direction;
/// - Arabic digits and Arabic punctuation stay inside an Arabic run, so `مرحبا،`
///   does not break in half;
/// - Latin digits read left to right even inside Arabic, so `123.45%` stays one
///   piece;
/// - brackets, quotes and symbols are neutral: they take the direction of the
///   runs on both sides when those agree, and otherwise the base direction — so
///   an English full stop after an Arabic name ends the English sentence instead
///   of moving to the wrong side of the name.
///
/// Pass `base` when you know the paragraph direction — say, because the column is
/// Arabic and this is one row of it. With `None` the base is the direction of the
/// first strong character, which is what the browser would assume anyway.
///
/// ```
/// use bidi_kit::{segments, Direction};
///
/// let runs: Vec<(Direction, &str)> = segments("Write to أحمد.", None)
///     .into_iter()
///     .map(|run| (run.dir, run.text))
///     .collect();
///
/// assert_eq!(
///     runs,
///     vec![
///         (Direction::Ltr, "Write to "),
///         (Direction::Rtl, "أحمد"),
///         (Direction::Ltr, "."),
///     ]
/// );
/// ```
#[must_use]
pub fn segments<'a>(text: &'a str, base: Option<Direction>) -> Vec<Segment<'a>> {
    let fallback = base.unwrap_or_else(|| resolve_direction(text));
    let chars: Vec<(usize, char)> = text.char_indices().collect();
    let mut drafts: Vec<Draft> = Vec::new();
    let mut current: Option<Draft> = None;

    for (index, &(start, character)) in chars.iter().enumerate() {
        let end = start + character.len_utf8();
        let dir = match class_at(&chars, index) {
            CharClass::Rtl | CharClass::RtlWeak => Some(Direction::Rtl),
            CharClass::Ltr | CharClass::LtrWeak => Some(Direction::Ltr),
            // Whitespace and marks never decide anything: they belong to the run
            // being built, and to a neutral run if there is none yet.
            CharClass::Join => current.and_then(|draft| draft.dir),
            CharClass::Neutral => None,
        };

        if matches!(current, Some(draft) if draft.dir == dir) {
            current = current.map(|draft| Draft { end, ..draft });
        } else {
            drafts.extend(current.take());
            current = Some(Draft { start, end, dir });
        }
    }
    drafts.extend(current);

    let resolved = resolve_neutrals(&drafts, fallback);
    merge(&resolved, text)
}

/// N1/N2 in miniature: a neutral takes the direction of agreeing neighbours,
/// and otherwise the base direction.
fn resolve_neutrals(drafts: &[Draft], base: Direction) -> Vec<Draft> {
    let mut resolved = Vec::with_capacity(drafts.len());
    for (index, draft) in drafts.iter().enumerate() {
        let dir = draft.dir.unwrap_or_else(|| {
            let before = previous_direction(drafts, index);
            let after = next_direction(drafts, index);
            match (before, after) {
                (Some(before), Some(after)) if before == after => before,
                _ => base,
            }
        });
        resolved.push(Draft {
            dir: Some(dir),
            ..*draft
        });
    }
    resolved
}

fn previous_direction(drafts: &[Draft], index: usize) -> Option<Direction> {
    drafts[..index].iter().rev().find_map(|draft| draft.dir)
}

fn next_direction(drafts: &[Draft], index: usize) -> Option<Direction> {
    drafts[index + 1..].iter().find_map(|draft| draft.dir)
}

/// Joins neighbouring runs that ended up the same direction.
fn merge<'a>(drafts: &[Draft], text: &'a str) -> Vec<Segment<'a>> {
    let mut merged: Vec<Draft> = Vec::with_capacity(drafts.len());
    for draft in drafts {
        let extends_last = merged.last().is_some_and(|last| last.dir == draft.dir);
        if extends_last {
            if let Some(last) = merged.last_mut() {
                last.end = draft.end;
            }
        } else {
            merged.push(*draft);
        }
    }
    merged
        .into_iter()
        .map(|draft| Segment {
            text: &text[draft.start..draft.end],
            dir: draft
                .dir
                .expect("every draft is resolved before it is merged"),
            start: draft.start,
            end: draft.end,
        })
        .collect()
}

/// The direction of the first strong character, which is what `dir="auto"`
/// resolves to.
///
/// `None` means the text has no strong character at all — a string of digits, or
/// of punctuation, or nothing.
#[must_use]
pub fn detect_direction(text: &str) -> Option<Direction> {
    for ch in text.chars() {
        match base_class(ch) {
            CharClass::Rtl | CharClass::RtlWeak => return Some(Direction::Rtl),
            CharClass::Ltr | CharClass::LtrWeak => return Some(Direction::Ltr),
            CharClass::Join | CharClass::Neutral => {}
        }
    }
    None
}

/// Like [`detect_direction`], but always answers — the same fallback HTML uses
/// for `dir="auto"`, so the result is always safe to write to an attribute.
#[must_use]
pub fn resolve_direction(text: &str) -> Direction {
    detect_direction(text).unwrap_or(Direction::Ltr)
}

#[cfg(test)]
mod tests {
    use super::{detect_direction, resolve_direction, segments, Segment};
    use crate::Direction;

    fn shape(text: &str, base: Option<Direction>) -> Vec<(Direction, &str)> {
        segments(text, base)
            .into_iter()
            .map(|run| (run.dir, run.text))
            .collect()
    }

    #[test]
    fn an_arabic_word_inside_an_english_sentence_is_one_rtl_run() {
        assert_eq!(
            shape("Hello أحمد world", None),
            vec![
                (Direction::Ltr, "Hello "),
                (Direction::Rtl, "أحمد "),
                (Direction::Ltr, "world"),
            ]
        );
    }

    #[test]
    fn an_english_full_stop_after_an_arabic_name_stays_outside_the_arabic_run() {
        let runs = segments("Write to أحمد.", None);
        let last = runs.last().copied().expect("three runs");
        assert_eq!(last.dir, Direction::Ltr);
        assert_eq!(last.text, ".");
    }

    #[test]
    fn offsets_are_bytes_into_the_original_string() {
        let text = "Hi محمود!";
        for run in segments(text, None) {
            assert_eq!(&text[run.start..run.end], run.text);
        }
    }

    #[test]
    fn byte_offsets_differ_from_utf16_for_astral_characters() {
        // U+1EE00 ARABIC MATHEMATICAL ALEF is four bytes, two UTF-16 units.
        let text = "x\u{1ee00}y";
        let runs = segments(text, None);
        assert_eq!(runs[1].start, 1);
        assert_eq!(runs[1].end, 5);
        assert_eq!(runs[1].text, "\u{1ee00}");
        assert_eq!(runs[2].start, 5);
    }

    #[test]
    fn arabic_punctuation_stays_inside_the_arabic_run() {
        assert_eq!(
            shape("مرحبا، كيف حالك؟", None),
            vec![(Direction::Rtl, "مرحبا، كيف حالك؟")]
        );
    }

    #[test]
    fn latin_digits_keep_their_separators_inside_arabic() {
        assert_eq!(
            shape("الخصم 15% فقط.", None),
            vec![
                (Direction::Rtl, "الخصم "),
                (Direction::Ltr, "15% "),
                (Direction::Rtl, "فقط."),
            ]
        );
    }

    #[test]
    fn a_phone_number_keeps_its_shape_inside_an_arabic_sentence() {
        let runs = segments("الهاتف: +216 71 123 456", None);
        assert!(runs.iter().any(|run| run.text.contains("216 71 123 456")));
    }

    #[test]
    fn the_base_direction_decides_where_a_trailing_full_stop_goes() {
        assert_eq!(
            shape("مرحبا.", Some(Direction::Ltr)),
            vec![(Direction::Rtl, "مرحبا"), (Direction::Ltr, ".")]
        );
        assert_eq!(
            shape("مرحبا.", Some(Direction::Rtl)),
            vec![(Direction::Rtl, "مرحبا.")]
        );
    }

    #[test]
    fn an_empty_string_has_no_runs() {
        assert!(segments("", None).is_empty());
        assert_eq!(detect_direction(""), None);
        assert_eq!(resolve_direction(""), Direction::Ltr);
    }

    #[test]
    fn direction_detection_follows_the_first_strong_character() {
        assert_eq!(detect_direction("Hello مرحبا"), Some(Direction::Ltr));
        assert_eq!(detect_direction("مرحبا Hello"), Some(Direction::Rtl));
        assert_eq!(detect_direction("123 + 456"), Some(Direction::Ltr));
        assert_eq!(detect_direction("() ! -"), None);
    }

    #[test]
    fn a_run_carries_its_own_offsets() {
        let runs: Vec<Segment<'_>> = segments("abc مرحبا", None);
        assert_eq!(runs[0].start, 0);
        assert_eq!(runs[0].end, 4);
        assert!(runs[1].is_rtl());
    }
}
