import { readFileSync, writeFileSync } from "node:fs";
// Generates the shared fixture file from the JavaScript implementation.
//
// The JavaScript is the reference: the corpus records what it actually does, so
// that a port can be checked against behaviour instead of against a description
// of behaviour. Regenerate only when the segmenter changed on purpose, and read
// the resulting diff as a specification change, not as a test that needs
// updating.
import { detectDirection, resolveDirection, segments } from "../packages/bidi-kit/dist/esm/index.js";

const CASES = [
  ["Hello أحمد world", null],
  ["Write to أحمد.", null],
  ["مرحبا، كيف حالك؟", null],
  ["الهاتف: +216 71 123 456", null],
  ["الخصم 15% فقط.", null],
  ["السعر 1,248.50 دينار.", null],
  ["الموعد: 12/11/2026 على الساعة 09:30.", null],
  ["contact@exemple.tn ومعرف آخر", null],
  ["قال المدير: « Bonjour à tous »", null],
  ["مرحبا Hello", null],
  ["123 + 456", null],
  ["", null],
  ["   ", null],
  ["الْعَرَبِيَّة", null],
  ["x\u{1EE00}y", null],
  ["١٢٣ ٤٥٦", null],
  ["Bonjour à tous", null],
  ["مرحبا.", "ltr"],
  ["مرحبا.", "rtl"],
  ["شكراً لك، see you at 17:00.", null],
  ["\u{202E}report.exe", null],
  ["Ελληνικά και العربية", null],
  ["50% off — تخفيض 50%", null],
  ["مرحبا، bienvenue", "rtl"],
  ["The report is ready: تقرير جاهز", "ltr"],
];

const cases = CASES.map(([text, base]) => ({
  text,
  base: base ?? null,
  runs: segments(text, base).map((run) => [run.dir, run.text]),
  detect: detectDirection(text),
  resolve: resolveDirection(text),
}));

const document = {
  note:
    "Shared fixtures for the JavaScript package and the Rust crate. " +
    "Generated from the JavaScript implementation, which is the reference: " +
    "if a port disagrees with a line here, the port is wrong. Regenerate with " +
    "`node tools/gen-corpus.mjs` after changing the segmenter on purpose.",
  cases,
};

const target = new URL("../packages/bidi-kit/tests/corpus.json", import.meta.url);
const output = `${JSON.stringify(document, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== output) {
    console.error("packages/bidi-kit/tests/corpus.json is stale; run node tools/gen-corpus.mjs");
    process.exit(1);
  }
  console.log(`corpus.json matches the library — ${cases.length} cases`);
} else {
  writeFileSync(target, output);
  console.log(`wrote ${cases.length} cases`);
}
