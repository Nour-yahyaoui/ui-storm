//! What a single character contributes to direction resolution.
//!
//! The distinction that matters is between *strong* characters, which decide a
//! run's direction, and weak ones, which are carried along by a neighbour. The
//! finer distinction — which neighbour — is what keeps a full stop after an
//! Arabic name at the end of the English sentence it belongs to.

use crate::tables;

/// What one character says about direction.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CharClass {
    /// A letter of a right-to-left script, and the right-to-left mark `U+200F`.
    Rtl,
    /// A letter of a left-to-right script, and the left-to-right mark `U+200E`.
    Ltr,
    /// Arabic-Indic digits and Arabic punctuation: they belong to an RTL run.
    RtlWeak,
    /// Latin digits: they read left to right even inside Arabic.
    LtrWeak,
    /// Whitespace, combining marks and invisible controls: they decide nothing.
    Join,
    /// Brackets, quotes and symbols: they take their direction from neighbours.
    Neutral,
}

/// Scripts written right to left, as inclusive code point ranges.
const RTL_RANGES: &[(u32, u32)] = &[
    (0x0590, 0x05ff), // Hebrew
    (0x0600, 0x06ff), // Arabic
    (0x0700, 0x074f), // Syriac
    (0x0750, 0x077f), // Arabic Supplement
    (0x0780, 0x07bf), // Thaana
    (0x07c0, 0x07ff), // NKo
    (0x0800, 0x083f), // Samaritan
    (0x0840, 0x085f), // Mandaic
    (0x0860, 0x086f), // Syriac Supplement
    (0x0870, 0x08ff), // Arabic Extended-B and -A
    (0xfb1d, 0xfb4f), // Hebrew presentation forms
    (0xfb50, 0xfdff), // Arabic presentation forms A
    (0xfe70, 0xfeff), // Arabic presentation forms B
    (0x1e800, 0x1e8df), // Mende Kikakui
    (0x1e900, 0x1e95f), // Adlam
    (0x1ee00, 0x1eeff), // Arabic mathematical alphabetic symbols
];

/// Arabic comma, semicolon, question mark, percent and the rest of the set.
fn is_arabic_punctuation(ch: char) -> bool {
    matches!(
        ch,
        '\u{060c}' | '\u{061b}' | '\u{061f}' | '\u{066a}'..='\u{066d}' | '\u{06d4}'
    )
}

/// Arabic-Indic and Extended Arabic-Indic digits.
fn is_arabic_digit(ch: char) -> bool {
    matches!(ch, '\u{0660}'..='\u{0669}' | '\u{06f0}'..='\u{06f9}')
}

/// A neutral that joins a number when it sits between two digits: `1,000.5%`.
fn is_numeric_joiner(ch: char) -> bool {
    matches!(ch, '.' | ',' | ':' | '+' | '-' | '\u{066b}' | '\u{066c}')
}

/// A percent sign is part of the number it follows, not a sentence of its own.
fn is_numeric_suffix(ch: char) -> bool {
    matches!(ch, '%' | '\u{2030}' | '\u{066a}')
}

/// What JavaScript's `\s` matches, which is not Rust's `char::is_whitespace`.
fn is_javascript_whitespace(ch: char) -> bool {
    matches!(
        ch,
        '\t' | '\n'
            | '\u{000b}'
            | '\u{000c}'
            | '\r'
            | ' '
            | '\u{00a0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200a}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202f}'
            | '\u{205f}'
            | '\u{3000}'
            | '\u{feff}'
    )
}

/// True when the code point belongs to a script written right to left.
pub(crate) fn is_rtl_code_point(code: u32) -> bool {
    tables::in_table(RTL_RANGES, code)
}

/// True when the string contains at least one right-to-left character.
#[must_use]
pub fn has_rtl(text: &str) -> bool {
    text.chars().any(|ch| is_rtl_code_point(ch as u32))
}

/// True when the string contains Arabic letters, as opposed to Arabic digits.
#[must_use]
pub fn has_arabic(text: &str) -> bool {
    text.chars().any(|ch| {
        let code = ch as u32;
        let in_arabic_script = (0x0600..=0x06ff).contains(&code)
            || (0x0750..=0x077f).contains(&code)
            || (0xfb50..=0xfdff).contains(&code)
            || (0xfe70..=0xfeff).contains(&code);
        in_arabic_script && tables::in_table(tables::LETTER, code)
    })
}

/// The class of a character on its own, before looking at its neighbours.
pub(crate) fn base_class(ch: char) -> CharClass {
    let code = ch as u32;
    match ch {
        '\u{200f}' => CharClass::Rtl,
        '\u{200e}' => CharClass::Ltr,
        _ if is_arabic_digit(ch) => CharClass::RtlWeak,
        _ if tables::in_table(tables::DECIMAL_DIGIT, code) => CharClass::LtrWeak,
        _ if tables::in_table(tables::MARK, code) => CharClass::Join,
        _ if is_javascript_whitespace(ch)
            || tables::in_table(tables::SEPARATOR, code)
            || tables::in_table(tables::FORMAT, code) =>
        {
            CharClass::Join
        }
        _ if is_arabic_punctuation(ch) => CharClass::RtlWeak,
        _ if is_rtl_code_point(code) => CharClass::Rtl,
        // Letters are what is left: a symbol or a bracket is neutral, a letter is not.
        _ if tables::in_table(tables::LETTER, code) => CharClass::Ltr,
        _ => CharClass::Neutral,
    }
}

/// The class a digit contributes when it weakens a neighbouring neutral.
fn weak_class_of(ch: char) -> Option<CharClass> {
    if !tables::in_table(tables::DECIMAL_DIGIT, ch as u32) {
        return None;
    }
    Some(if is_arabic_digit(ch) {
        CharClass::RtlWeak
    } else {
        CharClass::LtrWeak
    })
}

/// The class of a character, resolved against the characters either side of it.
pub(crate) fn class_at(chars: &[(usize, char)], index: usize) -> CharClass {
    let ch = chars[index].1;
    let class = base_class(ch);
    if class != CharClass::Neutral {
        return class;
    }

    let previous = index.checked_sub(1).map(|earlier| chars[earlier].1);
    let next = chars.get(index + 1).map(|&(_, later)| later);

    let Some(before) = previous.and_then(weak_class_of) else {
        return class;
    };
    if is_numeric_suffix(ch) {
        return before;
    }
    if !is_numeric_joiner(ch) {
        return class;
    }
    match next.and_then(weak_class_of) {
        Some(_) => before,
        None => class,
    }
}

#[cfg(test)]
mod tests {
    use super::{base_class, has_arabic, has_rtl, CharClass};

    #[test]
    fn the_marks_are_strong() {
        assert_eq!(base_class('\u{200f}'), CharClass::Rtl);
        assert_eq!(base_class('\u{200e}'), CharClass::Ltr);
    }

    #[test]
    fn digits_and_punctuation_lean_the_way_they_read() {
        assert_eq!(base_class('٤'), CharClass::RtlWeak);
        assert_eq!(base_class('4'), CharClass::LtrWeak);
        assert_eq!(base_class('،'), CharClass::RtlWeak);
        assert_eq!(base_class(','), CharClass::Neutral);
        assert_eq!(base_class('م'), CharClass::Rtl);
        assert_eq!(base_class('a'), CharClass::Ltr);
        assert_eq!(base_class('('), CharClass::Neutral);
    }

    #[test]
    fn marks_and_controls_join_whatever_is_being_built() {
        assert_eq!(base_class('\u{064e}'), CharClass::Join); // fatha
        assert_eq!(base_class('\u{200d}'), CharClass::Join); // zero-width joiner
        assert_eq!(base_class(' '), CharClass::Join);
    }

    #[test]
    fn script_probes() {
        assert!(has_rtl("مرحبا"));
        assert!(!has_rtl("hello"));
        assert!(has_arabic("مرحبا"));
        assert!(!has_arabic("١٢٣"), "digits are not letters");
    }
}
