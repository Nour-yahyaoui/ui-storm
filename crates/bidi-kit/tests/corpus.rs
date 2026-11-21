//! Runs the shared fixtures through the Rust port.
//!
//! `packages/bidi-kit/tests/corpus.json` is generated from the JavaScript
//! implementation, which is the reference. Both implementations read the same
//! file; this is what makes "the port agrees with the library" a claim CI can
//! refute instead of one a README can assert.

use std::fs;
use std::path::PathBuf;

use bidi_kit::{detect_direction, resolve_direction, segments, Direction};
use serde_json::Value;

fn corpus() -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("bidi-kit")
        .join("tests")
        .join("corpus.json");
    let raw = fs::read_to_string(&path)
        .unwrap_or_else(|error| panic!("cannot read {}: {error}", path.display()));
    serde_json::from_str(&raw).expect("corpus.json is valid JSON")
}

fn parse_direction(text: &str) -> Direction {
    match text {
        "ltr" => Direction::Ltr,
        "rtl" => Direction::Rtl,
        other => panic!("not a direction: {other:?}"),
    }
}

fn direction(value: &Value) -> Direction {
    parse_direction(value.as_str().expect("a direction string"))
}

#[test]
fn the_port_agrees_with_the_javascript_package() {
    let document = corpus();
    let cases = document["cases"].as_array().expect("a cases array");
    assert!(!cases.is_empty(), "the corpus is empty");

    for case in cases {
        let text = case["text"].as_str().expect("text");
        let base = case["base"].as_str().map(parse_direction);

        let expected: Vec<(Direction, &str)> = case["runs"]
            .as_array()
            .expect("a runs array")
            .iter()
            .map(|run| {
                let pair = run.as_array().expect("a [dir, text] pair");
                (direction(&pair[0]), pair[1].as_str().expect("run text"))
            })
            .collect();

        let actual: Vec<(Direction, &str)> = segments(text, base)
            .into_iter()
            .map(|run| (run.dir, run.text))
            .collect();

        assert_eq!(actual, expected, "runs disagree for {text:?}");

        let detected = match case["detect"].as_str() {
            Some("ltr") => Some(Direction::Ltr),
            Some("rtl") => Some(Direction::Rtl),
            _ => None,
        };
        assert_eq!(
            detect_direction(text),
            detected,
            "detect_direction disagrees for {text:?}"
        );

        assert_eq!(
            resolve_direction(text),
            direction(&case["resolve"]),
            "resolve_direction disagrees for {text:?}"
        );
    }
}

#[test]
fn every_run_slices_back_to_its_own_text() {
    let document = corpus();
    for case in document["cases"].as_array().expect("a cases array") {
        let text = case["text"].as_str().expect("text");
        for run in segments(text, None) {
            assert_eq!(&text[run.start..run.end], run.text);
        }
    }
}

#[test]
fn offsets_are_bytes_not_utf16_units() {
    // U+1EE00 is two UTF-16 units and four bytes. The JavaScript package would
    // report this run as [1, 3); the port reports [1, 5).
    let text = "x\u{1ee00}y";
    let runs = segments(text, None);
    assert_eq!(runs[1].start, 1);
    assert_eq!(runs[1].end, 5);
    assert_eq!(runs[1].text, "\u{1ee00}");
}
