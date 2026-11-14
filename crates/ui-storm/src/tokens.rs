//! Design tokens as Rust data, and the contrast maths that guards them.
//!
//! The stylesheet is the thing browsers read, but it is not allowed to be the
//! only copy of the palette: these constants are checked against
//! `assets/ui-storm.css` at test time, and every text/background pair the
//! components use is checked against its WCAG 2.2 threshold. A colour that is
//! added to the CSS but not here — or that fails its ratio — breaks the build.

/// WCAG 2.2 AA minimum for body text.
pub const AA_TEXT: f64 = 4.5;
/// WCAG 2.2 AA minimum for large text, UI boundaries and focus indicators.
pub const AA_NON_TEXT: f64 = 3.0;

/// A colour theme.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Theme {
    Light,
    Dark,
}

impl Theme {
    /// Both themes, light first.
    pub const ALL: [Theme; 2] = [Theme::Light, Theme::Dark];

    /// The value of `data-theme` that activates this theme.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Light => "light",
            Self::Dark => "dark",
        }
    }

    /// The CSS selector that holds this theme's custom properties.
    pub const fn selector(self) -> &'static str {
        match self {
            Self::Light => ":root",
            Self::Dark => "[data-theme=\"dark\"]",
        }
    }
}

const LIGHT: &[(&str, &str)] = &[
    ("--ui-color-bg", "#ffffff"),
    ("--ui-color-surface", "#f4f5f7"),
    ("--ui-color-text", "#14161a"),
    ("--ui-color-muted", "#4d5563"),
    ("--ui-color-border", "#c2c7d0"),
    ("--ui-color-border-strong", "#69707d"),
    ("--ui-color-accent", "#1d4ed8"),
    ("--ui-color-accent-hover", "#1e40af"),
    ("--ui-color-on-accent", "#ffffff"),
    ("--ui-color-danger", "#b42318"),
    ("--ui-color-on-danger", "#ffffff"),
    ("--ui-color-success", "#067647"),
    ("--ui-color-focus", "#1d4ed8"),
];

const DARK: &[(&str, &str)] = &[
    ("--ui-color-bg", "#0e1014"),
    ("--ui-color-surface", "#171a21"),
    ("--ui-color-text", "#f1f3f7"),
    ("--ui-color-muted", "#aeb6c3"),
    ("--ui-color-border", "#333a45"),
    ("--ui-color-border-strong", "#8a93a1"),
    ("--ui-color-accent", "#8fb3ff"),
    ("--ui-color-accent-hover", "#b3caff"),
    ("--ui-color-on-accent", "#0b1020"),
    ("--ui-color-danger", "#ffb4ab"),
    ("--ui-color-on-danger", "#3c0a06"),
    ("--ui-color-success", "#75e0a7"),
    ("--ui-color-focus", "#8fb3ff"),
];

/// Text pairs that must reach [`AA_TEXT`]: name, foreground token, background token.
pub const TEXT_PAIRS: &[(&str, &str, &str)] = &[
    ("body text", "--ui-color-text", "--ui-color-bg"),
    ("body text on surface", "--ui-color-text", "--ui-color-surface"),
    ("muted text", "--ui-color-muted", "--ui-color-bg"),
    ("muted text on surface", "--ui-color-muted", "--ui-color-surface"),
    ("primary button label", "--ui-color-on-accent", "--ui-color-accent"),
    ("primary button label, hover", "--ui-color-on-accent", "--ui-color-accent-hover"),
    ("danger button label", "--ui-color-on-danger", "--ui-color-danger"),
    ("link on page", "--ui-color-accent", "--ui-color-bg"),
    ("link on surface", "--ui-color-accent", "--ui-color-surface"),
    ("error message", "--ui-color-danger", "--ui-color-bg"),
    ("error message on surface", "--ui-color-danger", "--ui-color-surface"),
    ("success message", "--ui-color-success", "--ui-color-bg"),
    ("success message on surface", "--ui-color-success", "--ui-color-surface"),
];

/// Non-text pairs that must reach [`AA_NON_TEXT`]: control boundaries and focus rings.
pub const NON_TEXT_PAIRS: &[(&str, &str, &str)] = &[
    ("input boundary", "--ui-color-border-strong", "--ui-color-bg"),
    ("input boundary on surface", "--ui-color-border-strong", "--ui-color-surface"),
    ("focus ring", "--ui-color-focus", "--ui-color-bg"),
    ("focus ring on surface", "--ui-color-focus", "--ui-color-surface"),
    ("accent fill", "--ui-color-accent", "--ui-color-bg"),
    ("accent fill on surface", "--ui-color-accent", "--ui-color-surface"),
];

/// The declared palette for a theme.
pub const fn palette(theme: Theme) -> &'static [(&'static str, &'static str)] {
    match theme {
        Theme::Light => LIGHT,
        Theme::Dark => DARK,
    }
}

/// Looks up a token value, e.g. `token(Theme::Light, "--ui-color-text")`.
pub fn token(theme: Theme, name: &str) -> Option<&'static str> {
    palette(theme)
        .iter()
        .find(|(token_name, _)| *token_name == name)
        .map(|(_, value)| *value)
}

/// An sRGB colour.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rgb {
    /// Red channel.
    pub r: u8,
    /// Green channel.
    pub g: u8,
    /// Blue channel.
    pub b: u8,
}

impl Rgb {
    /// Parses `#rrggbb` (the only form the stylesheet may use).
    pub fn from_hex(hex: &str) -> Option<Self> {
        let digits = hex.strip_prefix('#')?;
        if digits.len() != 6 || !digits.is_ascii() {
            return None;
        }
        let channel = |start: usize| u8::from_str_radix(&digits[start..start + 2], 16).ok();
        Some(Self {
            r: channel(0)?,
            g: channel(2)?,
            b: channel(4)?,
        })
    }

    /// WCAG relative luminance.
    pub fn relative_luminance(self) -> f64 {
        fn linearise(channel: u8) -> f64 {
            let value = f64::from(channel) / 255.0;
            if value <= 0.040_45 {
                value / 12.92
            } else {
                ((value + 0.055) / 1.055).powf(2.4)
            }
        }

        0.2126 * linearise(self.r) + 0.7152 * linearise(self.g) + 0.0722 * linearise(self.b)
    }
}

/// WCAG contrast ratio between two colours, from 1.0 to 21.0.
pub fn contrast_ratio(a: Rgb, b: Rgb) -> f64 {
    let (first, second) = (a.relative_luminance(), b.relative_luminance());
    let (lighter, darker) = if first >= second {
        (first, second)
    } else {
        (second, first)
    };
    (lighter + 0.05) / (darker + 0.05)
}

/// One audited pair.
#[derive(Debug, Clone, PartialEq)]
pub struct ContrastCheck {
    /// Human-readable description of what the pair is used for.
    pub label: &'static str,
    /// Foreground token.
    pub foreground: &'static str,
    /// Background token.
    pub background: &'static str,
    /// Measured ratio.
    pub ratio: f64,
    /// Required ratio.
    pub minimum: f64,
}

impl ContrastCheck {
    /// Whether the pair meets its threshold.
    pub fn passes(&self) -> bool {
        self.ratio >= self.minimum
    }
}

fn check_pair(
    theme: Theme,
    (label, foreground, background): (&'static str, &'static str, &'static str),
    minimum: f64,
) -> ContrastCheck {
    let ratio = match (token(theme, foreground), token(theme, background)) {
        (Some(fg), Some(bg)) => match (Rgb::from_hex(fg), Rgb::from_hex(bg)) {
            (Some(fg), Some(bg)) => contrast_ratio(fg, bg),
            _ => 0.0,
        },
        _ => 0.0,
    };

    ContrastCheck {
        label,
        foreground,
        background,
        ratio,
        minimum,
    }
}

/// Every audited pair for a theme, text pairs first.
pub fn contrast_checks(theme: Theme) -> Vec<ContrastCheck> {
    TEXT_PAIRS
        .iter()
        .map(|pair| check_pair(theme, *pair, AA_TEXT))
        .chain(
            NON_TEXT_PAIRS
                .iter()
                .map(|pair| check_pair(theme, *pair, AA_NON_TEXT)),
        )
        .collect()
}

/// Extracts the body of the first CSS rule with the given selector.
pub fn css_rule<'a>(css: &'a str, selector: &str) -> Option<&'a str> {
    let after_selector = &css[css.find(selector)? + selector.len()..];
    let start = after_selector.find('{')? + 1;
    let body = &after_selector[start..];
    let end = body.find('}')?;
    Some(&body[..end])
}

/// Custom property declarations inside a rule body, in source order.
pub fn declarations(block: &str) -> Vec<(&str, &str)> {
    block
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if !line.starts_with("--") {
                return None;
            }
            let (name, value) = line.trim_end_matches(';').split_once(':')?;
            Some((name.trim(), value.trim()))
        })
        .collect()
}

/// Colour tokens the stylesheet declares for a theme.
pub fn stylesheet_palette(theme: Theme) -> Vec<(&'static str, &'static str)> {
    css_rule(crate::assets::CSS, theme.selector())
        .map(declarations)
        .unwrap_or_default()
        .into_iter()
        .filter(|(name, _)| name.starts_with("--ui-color-"))
        .collect()
}

/// Every custom property declared in the base rule, in source order.
///
/// This reads the real stylesheet, so the gallery cannot document a scale
/// token that no longer exists.
pub fn base_declarations() -> Vec<(&'static str, &'static str)> {
    css_rule(crate::assets::CSS, ":root")
        .map(declarations)
        .unwrap_or_default()
}

/// Tokens whose name starts with `prefix`, e.g. `--ui-space-`.
pub fn scale_tokens(prefix: &str) -> Vec<(&'static str, &'static str)> {
    base_declarations()
        .into_iter()
        .filter(|(name, _)| name.starts_with(prefix))
        .collect()
}

/// Renders a theme's palette as CSS declarations, for inline theming.
pub fn css_variables(theme: Theme) -> String {
    palette(theme)
        .iter()
        .map(|(name, value)| format!("{name}: {value};"))
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_parsing_rejects_malformed_values() {
        assert_eq!(
            Rgb::from_hex("#1d4ed8"),
            Some(Rgb {
                r: 29,
                g: 78,
                b: 216
            })
        );
        for bad in ["1d4ed8", "#1d4ed", "#1d4ed8ff", "#gggggg", ""] {
            assert_eq!(Rgb::from_hex(bad), None, "{bad} should not parse");
        }
    }

    #[test]
    fn contrast_matches_known_values() {
        let white = Rgb::from_hex("#ffffff").unwrap();
        let black = Rgb::from_hex("#000000").unwrap();
        assert!((contrast_ratio(white, black) - 21.0).abs() < 0.01);
        assert!((contrast_ratio(white, white) - 1.0).abs() < 0.001);
        // Symmetry: order does not matter.
        assert!((contrast_ratio(white, black) - contrast_ratio(black, white)).abs() < 1e-9);
    }

    #[test]
    fn every_pair_meets_its_threshold_in_both_themes() {
        for theme in Theme::ALL {
            for check in contrast_checks(theme) {
                assert!(
                    check.passes(),
                    "{} theme: {} ({}) is {:.2}:1, needs {:.1}:1",
                    theme.as_str(),
                    check.label,
                    check.foreground,
                    check.ratio,
                    check.minimum
                );
            }
        }
    }

    #[test]
    fn stylesheet_palette_matches_the_rust_tokens() {
        for theme in Theme::ALL {
            let declared = stylesheet_palette(theme);
            assert!(
                !declared.is_empty(),
                "no colour tokens found for the {} theme; check the selector {:?}",
                theme.as_str(),
                theme.selector()
            );
            assert_eq!(
                declared,
                palette(theme).to_vec(),
                "assets/ui-storm.css and tokens.rs disagree for the {} theme",
                theme.as_str()
            );
        }
    }

    #[test]
    fn every_stylesheet_colour_is_a_literal_hex() {
        for theme in Theme::ALL {
            for (name, value) in stylesheet_palette(theme) {
                assert!(
                    Rgb::from_hex(value).is_some(),
                    "{name} must be a #rrggbb literal, found {value:?}"
                );
            }
        }
    }

    #[test]
    fn audited_pairs_reference_real_tokens() {
        for theme in Theme::ALL {
            for (_, foreground, background) in TEXT_PAIRS.iter().chain(NON_TEXT_PAIRS) {
                assert!(token(theme, foreground).is_some(), "unknown token {foreground}");
                assert!(token(theme, background).is_some(), "unknown token {background}");
            }
        }
    }

    #[test]
    fn css_variables_round_trips_through_the_parser() {
        let css = format!(":root {{\n{}\n}}", css_variables(Theme::Light));
        let parsed = declarations(css_rule(&css, ":root").unwrap());
        assert_eq!(parsed, palette(Theme::Light).to_vec());
    }
}
