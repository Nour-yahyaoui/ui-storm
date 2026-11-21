//! Writing direction, as a value and as an HTML attribute.

use std::fmt;
use std::str::FromStr;

/// The direction of a run, a paragraph, or a document.
///
/// There are two, and that is the point: every third state people invent for
/// this — `auto`, `neutral`, `inherit` — is a question about a string, not a
/// direction. Ask [`crate::detect_direction`] and write the answer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Direction {
    /// Left to right, as in English or French.
    Ltr,
    /// Right to left, as in Arabic or Hebrew.
    Rtl,
}

impl Direction {
    /// The value written to an HTML `dir` attribute.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Ltr => "ltr",
            Self::Rtl => "rtl",
        }
    }

    /// Whether this direction is right to left.
    #[must_use]
    pub const fn is_rtl(self) -> bool {
        matches!(self, Self::Rtl)
    }

    /// The opposite direction.
    #[must_use]
    pub const fn flipped(self) -> Self {
        match self {
            Self::Ltr => Self::Rtl,
            Self::Rtl => Self::Ltr,
        }
    }
}

impl fmt::Display for Direction {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl FromStr for Direction {
    type Err = String;

    /// Parses `ltr` or `rtl`, in any case, ignoring surrounding whitespace.
    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_ascii_lowercase().as_str() {
            "ltr" => Ok(Self::Ltr),
            "rtl" => Ok(Self::Rtl),
            _ => Err(format!("not a direction: {value:?}")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Direction;

    #[test]
    fn round_trips_through_the_attribute_value() {
        assert_eq!("ltr".parse::<Direction>(), Ok(Direction::Ltr));
        assert_eq!(" RTL ".parse::<Direction>(), Ok(Direction::Rtl));
        assert_eq!(Direction::Rtl.to_string(), "rtl");
        assert!(Direction::Ltr.flipped().is_rtl());
        assert!("sideways".parse::<Direction>().is_err());
    }
}
