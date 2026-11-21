//! Building the markup, for the places that write strings rather than nodes.

use crate::{resolve_direction, Direction};

/// Attributes shared by the elements this module writes.
#[derive(Debug, Clone, Copy, Default)]
pub struct HtmlOptions<'a> {
    /// An explicit direction. `None` means "decide from the text" — `dir="auto"`
    /// on an inline element, and the resolved direction on a paragraph.
    pub dir: Option<Direction>,
    /// The `lang` attribute, which is what makes a screen reader switch voice.
    pub lang: Option<&'a str>,
    /// A class name to add.
    pub class: Option<&'a str>,
    /// A font stack, written as `style="font-family: …"`.
    pub font: Option<&'a str>,
}

/// One piece of a paragraph: plain text, or a run with a known direction.
#[derive(Debug, Clone, Copy)]
pub enum Part<'a> {
    /// Text with no declared direction. It is escaped and left to the algorithm.
    Text(&'a str),
    /// A named run: given a direction, and usually a language and a font.
    Run {
        /// The text of the run.
        text: &'a str,
        /// Its direction. `None` writes `dir="auto"`.
        dir: Option<Direction>,
        /// Its language, for font selection and screen readers.
        lang: Option<&'a str>,
        /// Its font stack.
        font: Option<&'a str>,
    },
}

impl Part<'_> {
    /// The text of the part, whatever kind it is.
    #[must_use]
    pub fn text(&self) -> &str {
        match self {
            Self::Text(text) | Self::Run { text, .. } => text,
        }
    }
}

/// Escapes text for use as element content or in a quoted attribute value.
#[must_use]
pub fn escape_html(text: &str) -> String {
    let mut escaped = String::with_capacity(text.len());
    for ch in text.chars() {
        match ch {
            '&' => escaped.push_str("&amp;"),
            '<' => escaped.push_str("&lt;"),
            '>' => escaped.push_str("&gt;"),
            '"' => escaped.push_str("&quot;"),
            '\'' => escaped.push_str("&#39;"),
            other => escaped.push(other),
        }
    }
    escaped
}

fn attribute(name: &str, value: Option<&str>) -> String {
    match value {
        Some(value) if !value.is_empty() => {
            let escaped = escape_html(value);
            format!(" {name}=\"{escaped}\"")
        }
        _ => String::new(),
    }
}

fn style_attribute(font: Option<&str>) -> String {
    match font {
        Some(font) if !font.is_empty() => {
            let escaped = escape_html(font);
            format!(" style=\"font-family: {escaped}\"")
        }
        _ => String::new(),
    }
}

/// A `<bdi>` element wrapping `text`.
///
/// `<bdi>` is the one HTML element whose whole job is this problem: it isolates
/// its content from the surrounding paragraph, so neither a neighbouring word
/// nor the algorithm can drag it into the wrong place. Reach for it before
/// reaching for a mark you cannot see.
///
/// ```
/// use bidi_kit::bdi_html;
///
/// assert_eq!(bdi_html("مرحبا", Default::default()), "<bdi>مرحبا</bdi>");
/// ```
#[must_use]
pub fn bdi_html(text: &str, options: HtmlOptions<'_>) -> String {
    let dir = options.dir.map(Direction::as_str);
    let attributes = format!(
        "{}{}{}",
        attribute("dir", dir),
        attribute("lang", options.lang),
        attribute("class", options.class)
    );
    let inner = escape_html(text);
    format!("<bdi{attributes}>{inner}</bdi>")
}

/// A `<span dir>` that isolates by style instead of by element.
#[must_use]
pub fn inline_html(text: &str, options: HtmlOptions<'_>) -> String {
    let dir = options.dir.map_or("auto", Direction::as_str);
    let attributes = format!(
        "{}{}{}{}",
        attribute("dir", Some(dir)),
        attribute("lang", options.lang),
        attribute("class", options.class),
        style_attribute(options.font)
    );
    let inner = escape_html(text);
    format!("<span{attributes}>{inner}</span>")
}

/// Builds one paragraph out of mixed parts.
///
/// Named parts get an explicit direction and, if you pass one, a font: that is
/// how an Arabic sentence inside a French paragraph ends up in a face that
/// actually has the glyphs, instead of a fallback the operating system picked
/// without asking. The paragraph direction comes from its words, not its tags.
///
/// ```
/// use bidi_kit::{paragraph_html, Part};
///
/// let html = paragraph_html(
///     &[
///         Part::Text("Sent to "),
///         Part::Run { text: "أحمد", dir: None, lang: Some("ar"), font: None },
///         Part::Text(" this morning."),
///     ],
///     Default::default(),
/// );
///
/// assert!(html.starts_with("<p dir=\"ltr\">"));
/// assert!(html.contains("<bdi dir=\"auto\" lang=\"ar\">أحمد</bdi>"));
/// ```
#[must_use]
pub fn paragraph_html(parts: &[Part<'_>], options: HtmlOptions<'_>) -> String {
    let plain: String = parts.iter().map(Part::text).collect();
    let dir = options.dir.unwrap_or_else(|| resolve_direction(&plain));

    let mut body = String::with_capacity(plain.len());
    for part in parts {
        match *part {
            Part::Text(text) => {
                let escaped = escape_html(text);
                body.push_str(&escaped);
            }
            Part::Run {
                text,
                dir,
                lang,
                font,
            } => {
                let attributes = format!(
                    "{}{}{}",
                    attribute("dir", Some(dir.map_or("auto", Direction::as_str))),
                    attribute("lang", lang),
                    style_attribute(font)
                );
                let escaped = escape_html(text);
                let element = format!("<bdi{attributes}>{escaped}</bdi>");
                body.push_str(&element);
            }
        }
    }

    let attributes = format!(
        "{}{}{}",
        attribute("dir", Some(dir.as_str())),
        attribute("lang", options.lang),
        attribute("class", options.class)
    );
    format!("<p{attributes}>{body}</p>")
}

#[cfg(test)]
mod tests {
    use super::{bdi_html, escape_html, inline_html, paragraph_html, HtmlOptions, Part};
    use crate::Direction;

    #[test]
    fn escaping_covers_the_five_characters_that_matter() {
        assert_eq!(
            escape_html("a & b < c > d \" e ' f"),
            "a &amp; b &lt; c &gt; d &quot; e &#39; f"
        );
    }

    #[test]
    fn a_bdi_leaves_auto_off_and_a_span_does_not() {
        assert_eq!(bdi_html("مرحبا", HtmlOptions::default()), "<bdi>مرحبا</bdi>");
        assert_eq!(
            inline_html("مرحبا", HtmlOptions::default()),
            "<span dir=\"auto\">مرحبا</span>"
        );
    }

    #[test]
    fn a_named_run_carries_its_language_and_font() {
        let html = bdi_html(
            "أحمد",
            HtmlOptions {
                dir: Some(Direction::Rtl),
                lang: Some("ar"),
                class: None,
                font: Some("Noto Naskh Arabic, serif"),
            },
        );
        assert_eq!(
            html,
            "<bdi dir=\"rtl\" lang=\"ar\" style=\"font-family: Noto Naskh Arabic, serif\">أحمد</bdi>"
        );
    }

    #[test]
    fn a_paragraph_takes_its_direction_from_its_words() {
        let html = paragraph_html(
            &[
                Part::Text("He said "),
                Part::Run {
                    text: "مرحبا",
                    dir: Some(Direction::Rtl),
                    lang: Some("ar"),
                    font: None,
                },
            ],
            HtmlOptions::default(),
        );
        assert!(html.starts_with("<p dir=\"ltr\">"));
        assert!(html.contains("<bdi dir=\"rtl\" lang=\"ar\">مرحبا</bdi>"));
        assert!(html.ends_with("</p>"));
    }

    #[test]
    fn an_arabic_paragraph_gets_an_arabic_base() {
        let html = paragraph_html(&[Part::Text("مرحبا بالجميع")], HtmlOptions::default());
        assert!(html.starts_with("<p dir=\"rtl\">"));
    }

    #[test]
    fn text_is_escaped_even_inside_a_run() {
        let html = bdi_html(
            "<script>",
            HtmlOptions {
                dir: Some(Direction::Ltr),
                ..HtmlOptions::default()
            },
        );
        assert!(!html.contains("<script>"));
        assert!(html.contains("&lt;script&gt;"));
    }
}
