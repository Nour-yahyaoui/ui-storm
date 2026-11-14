//! Static assets shipped with the library.
//!
//! The stylesheet and the enhancement script are compiled into the crate with
//! `include_str!`, so there is no build step between them and the binary, no
//! version skew between markup and CSS, and no way for the parser in
//! [`crate::tokens`] to read a stale copy.

/// The library stylesheet. Served by the gallery at `/assets/ui-storm.css`.
pub const CSS: &str = include_str!("../assets/ui-storm.css");

/// The progressive-enhancement script. Served at `/assets/ui-storm.js`.
pub const SCRIPT: &str = include_str!("../assets/ui-storm.js");

/// File name of [`CSS`].
pub const CSS_FILE: &str = "ui-storm.css";

/// File name of [`SCRIPT`].
pub const SCRIPT_FILE: &str = "ui-storm.js";

/// Removes `/* … */` comments so textual rules can be checked against
/// declarations rather than against prose.
pub fn strip_comments(source: &str) -> String {
    let mut out = String::with_capacity(source.len());
    let mut rest = source;
    while let Some(start) = rest.find("/*") {
        out.push_str(&rest[..start]);
        match rest[start + 2..].find("*/") {
            Some(end) => rest = &rest[start + 2 + end + 2..],
            None => return out,
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stylesheet_uses_only_logical_properties() {
        let css = strip_comments(CSS).to_lowercase();
        for physical in ["left", "right"] {
            assert!(
                !css.contains(physical),
                "the stylesheet contains {physical:?}; use inline-start/inline-end instead"
            );
        }
    }

    #[test]
    fn stylesheet_has_no_imports_and_no_external_urls() {
        let css = strip_comments(CSS);
        assert!(!css.contains("@import"), "@import would add a render-blocking request");
        assert!(!css.contains("url(http"), "the stylesheet must not fetch external assets");
    }

    #[test]
    fn stylesheet_honours_reduced_motion() {
        assert!(CSS.contains("prefers-reduced-motion: reduce"));
    }

    #[test]
    fn script_is_plain_es5_compatible_and_dependency_free() {
        assert!(!SCRIPT.contains("import "), "the script must be a single classic script");
        assert!(!SCRIPT.contains("innerHTML"), "never inject markup from the script");
        assert!(!SCRIPT.contains("document.write"));
        assert!(!SCRIPT.contains("eval("));
    }

    #[test]
    fn strip_comments_removes_block_comments() {
        assert_eq!(strip_comments("a/* b */c"), "ac");
        assert_eq!(strip_comments("a/* unterminated"), "a");
        assert_eq!(strip_comments("a"), "a");
    }
}
