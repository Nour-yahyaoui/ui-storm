//! Writing-direction resolution.
//!
//! Direction is derived from a BCP-47 locale once, on the server, and written to
//! `<html dir lang>`. CSS then works entirely in logical properties, so a
//! component has one implementation rather than two.

/// Writing direction of a locale or a document subtree.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    Ltr,
    Rtl,
}

impl Direction {
    /// The value of the HTML `dir` attribute.
    pub const fn as_str(self) -> &'static str {
        match self {
            Direction::Ltr => "ltr",
            Direction::Rtl => "rtl",
        }
    }

    /// `true` for right-to-left.
    pub const fn is_rtl(self) -> bool {
        matches!(self, Direction::Rtl)
    }

    /// The opposite direction — used by tests and by the gallery switcher.
    pub const fn flipped(self) -> Self {
        match self {
            Direction::Ltr => Direction::Rtl,
            Direction::Rtl => Direction::Ltr,
        }
    }
}

/// Base language subtags written right-to-left.
///
/// `ku` is deliberately absent: Kurdish is written in Latin script in Turkey
/// and Syria, so guessing would be wrong. Sorani is `ckb`.
const RTL_LANGUAGES: &[&str] = &[
    "ar", "arc", "ckb", "dv", "fa", "he", "iw", "ji", "khw", "ks", "ps", "sd", "ug", "ur", "yi",
];

/// Script subtags that force RTL regardless of the base language
/// (`az-Arab` is RTL even though Azerbaijani is normally LTR).
const RTL_SCRIPTS: &[&str] = &["arab", "aran", "hebr", "syrc", "thaa", "nkoo", "adlm"];

/// Resolves the direction of a BCP-47 locale tag.
///
/// ```
/// use ui_storm::direction::{locale_direction, Direction};
///
/// assert_eq!(locale_direction("ar-EG"), Direction::Rtl);
/// assert_eq!(locale_direction("az-Arab"), Direction::Rtl);
/// assert_eq!(locale_direction("en-GB"), Direction::Ltr);
/// assert_eq!(locale_direction(""), Direction::Ltr);
/// ```
pub fn locale_direction(locale: &str) -> Direction {
    let normalised = locale.trim().replace('_', "-").to_lowercase();
    let subtags: Vec<&str> = normalised.split('-').filter(|tag| !tag.is_empty()).collect();

    let Some(language) = subtags.first() else {
        return Direction::Ltr;
    };

    let has_rtl_script = subtags
        .iter()
        .any(|tag| tag.len() == 4 && RTL_SCRIPTS.contains(tag));

    if has_rtl_script || RTL_LANGUAGES.contains(language) {
        Direction::Rtl
    } else {
        Direction::Ltr
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_rtl_languages() {
        for locale in [
            "ar", "ar-EG", "ar_SA", "he-IL", "fa-IR", "ur-PK", "ps-AF", "ckb-IQ", "yi", "dv",
        ] {
            assert_eq!(locale_direction(locale), Direction::Rtl, "{locale}");
        }
    }

    #[test]
    fn resolves_ltr_languages() {
        for locale in ["en", "en-US", "fr", "tr", "az", "ku", "ku-Latn", "de-CH"] {
            assert_eq!(locale_direction(locale), Direction::Ltr, "{locale}");
        }
    }

    #[test]
    fn script_subtag_overrides_language() {
        assert_eq!(locale_direction("az-Arab"), Direction::Rtl);
        assert_eq!(locale_direction("pa-Arab-PK"), Direction::Rtl);
        assert_eq!(locale_direction("ku-Latn"), Direction::Ltr);
    }

    #[test]
    fn normalises_case_whitespace_and_separators() {
        assert_eq!(locale_direction("  AR-eg  "), Direction::Rtl);
        assert_eq!(locale_direction("ar_EG"), Direction::Rtl);
    }

    #[test]
    fn falls_back_to_ltr_for_empty_or_malformed_input() {
        for locale in ["", "   ", "-", "---", "undefined"] {
            assert_eq!(locale_direction(locale), Direction::Ltr, "{locale}");
        }
    }

    #[test]
    fn exposes_dir_attribute_values() {
        assert_eq!(Direction::Ltr.as_str(), "ltr");
        assert_eq!(Direction::Rtl.as_str(), "rtl");
        assert!(Direction::Rtl.is_rtl());
        assert!(!Direction::Ltr.is_rtl());
        assert_eq!(Direction::Ltr.flipped(), Direction::Rtl);
    }
}
