//! The page shell shared by every page: language, direction, theme, navigation.

use maud::{html, Markup, PreEscaped, DOCTYPE};
use ui_storm::tokens::{contrast_checks, Theme};
use ui_storm::Direction;

/// Navigation entries as `(path, label)`.
pub const NAV: &[(&str, &str)] = &[
    ("/", "Overview"),
    ("/foundations", "Foundations"),
    ("/components/button", "Button"),
    ("/components/icon-button", "Icon button"),
    ("/components/text-input", "Text input"),
    ("/components/checkbox", "Checkbox"),
    ("/components/dialog", "Dialog"),
    ("/components/tabs", "Tabs"),
    ("/accessibility", "Accessibility"),
    ("/rtl", "RTL"),
];

/// Reveals every tab panel when scripting is unavailable, so tabs degrade into
/// a plain list of sections instead of losing their content.
pub const NOSCRIPT_CSS: &str =
    ".ui-tabs__panel[hidden]{display:block !important}.ui-tabs__list{display:none !important}";

/// Everything the shell needs to know about the current request.
#[derive(Debug, Clone)]
pub struct PageContext {
    /// Page title, without the site suffix.
    pub title: String,
    /// Current path, used for `aria-current` and for building links.
    pub path: String,
    /// BCP-47 language tag written to `<html lang>`.
    pub lang: String,
    /// Resolved writing direction, written to `<html dir>`.
    pub dir: Direction,
    /// Active colour theme.
    pub theme: Theme,
}

impl PageContext {
    /// Builds a context for a request path.
    pub fn new(
        title: impl Into<String>,
        path: impl Into<String>,
        lang: impl Into<String>,
        dir: Direction,
        theme: Theme,
    ) -> Self {
        Self {
            title: title.into(),
            path: path.into(),
            lang: lang.into(),
            dir,
            theme,
        }
    }

    /// A link to `path` that keeps the current language and theme.
    pub fn href(&self, path: &str) -> String {
        format!("{path}?lang={}&theme={}", self.lang, self.theme.as_str())
    }

    /// A link to `path` with a different theme.
    pub fn theme_href(&self, path: &str, theme: Theme) -> String {
        format!("{path}?lang={}&theme={}", self.lang, theme.as_str())
    }

    /// A link to `path` with a different language.
    pub fn lang_href(&self, path: &str, lang: &str) -> String {
        format!("{path}?lang={lang}&theme={}", self.theme.as_str())
    }

    /// Whether `path` is the current page.
    pub fn is_current(&self, path: &str) -> bool {
        self.path == path
    }
}

impl PageContext {
    /// Wraps page content in the document shell.
    /// Renders the full document.
    pub fn render(&self, content: Markup) -> Markup {
        let title = format!("{} — ui-storm", self.title);
        let audited = contrast_checks(self.theme).len();

        html! {
            (DOCTYPE)
            html lang=(self.lang.as_str()) dir=(self.dir.as_str()) data-theme=(self.theme.as_str()) {
                head {
                    meta charset="utf-8";
                    meta name="viewport" content="width=device-width, initial-scale=1";
                    title { (title) }
                    meta
                        name="description"
                        content="Accessibility-first, RTL-native UI components rendered in Rust with Maud and Actix Web.";
                    link rel="stylesheet" href="/assets/ui-storm.css";
                    noscript { style { (PreEscaped(NOSCRIPT_CSS)) } }
                    script src="/assets/ui-storm.js" defer {}
                }
                body {
                    a class="ui-skip-link" href="#content" { "Skip to main content" }
                    div class="ui-gallery" {
                        header class="ui-gallery__header" {
                            p class="ui-gallery__brand" { "ui-storm" }
                            nav class="ui-gallery__nav" aria-label="Documentation" {
                                ul {
                                    @for (path, label) in NAV {
                                        li {
                                            a
                                                href=(self.href(path))
                                                aria-current=[self.is_current(path).then_some("page")]
                                            {
                                                (label)
                                            }
                                        }
                                    }
                                }
                            }
                            nav class="ui-gallery__nav" aria-label="Display options" {
                                ul {
                                    @for theme in Theme::ALL {
                                        li {
                                            a
                                                href=(self.theme_href(self.path.as_str(), theme))
                                                aria-current=[(theme == self.theme).then_some("true")]
                                            {
                                                (capitalise(theme.as_str()))
                                            }
                                        }
                                    }
                                    @for (code, label) in [("en", "English"), ("ar", "العربية")] {
                                        li {
                                            a
                                                href=(self.lang_href(self.path.as_str(), code))
                                                aria-current=[(code == self.lang).then_some("true")]
                                            {
                                                (label)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        main class="ui-gallery__main ui-prose" id="content" tabindex="-1" {
                            (content)
                        }
                        footer class="ui-gallery__footer" {
                            p {
                                "ui-storm · "
                                (audited)
                                " contrast pairs audited in the "
                                (self.theme.as_str())
                                " theme · Rust, Actix Web, Maud."
                            }
                        }
                    }
                }
            }
        }
    }
}

/// Uppercases the first character of an ASCII token.
fn capitalise(value: &str) -> String {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars).collect(),
        None => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_noscript_style_block_cannot_inject_markup() {
        // The rule is inlined with `PreEscaped`, so it must never contain a tag.
        assert!(!NOSCRIPT_CSS.contains('<'), "the noscript rule must not contain markup");
        assert!(!NOSCRIPT_CSS.contains('>'), "the noscript rule must not contain markup");
        assert!(NOSCRIPT_CSS.contains("display:block"));
    }

    #[test]
    fn every_navigation_entry_is_a_known_route() {
        let known = [
            "/", "/foundations", "/accessibility", "/rtl",
            "/components/button", "/components/icon-button", "/components/text-input",
            "/components/checkbox", "/components/dialog", "/components/tabs",
        ];
        for (path, label) in NAV {
            assert!(known.contains(path), "{label} points at an unknown route: {path}");
        }
    }

    #[test]
    fn links_carry_language_and_theme() {
        let ctx = PageContext::new("Title", "/foundations", "ar", ui_storm::Direction::Rtl, Theme::Dark);
        assert_eq!(ctx.href("/components/tabs"), "/components/tabs?lang=ar&theme=dark");
        assert_eq!(ctx.lang_href("/", "en"), "/?lang=en&theme=dark");
        assert_eq!(ctx.theme_href("/", Theme::Light), "/?lang=ar&theme=light");
        assert!(ctx.is_current("/foundations"));
        assert!(!ctx.is_current("/"));
    }
}
