import assert from "node:assert/strict";
import test from "node:test";
import {
  detectDirection,
  hasArabic,
  hasRtl,
  resolveDirection,
  segments,
  isolate,
  isolateRunsText,
  stripBidiControls,
  hasBidiControls,
} from "../dist/esm/index.js";

const shape = (text, base) => segments(text, base).map((run) => [run.dir, run.text]);

test("an Arabic word inside an English sentence is one RTL run", () => {
  assert.deepEqual(shape("Hello أحمد world"), [
    ["ltr", "Hello "],
    ["rtl", "أحمد "],
    ["ltr", "world"],
  ]);
});

test("an English full stop after an Arabic name stays outside the Arabic run", () => {
  const runs = segments("Write to أحمد.");
  assert.deepEqual(runs.at(-1), { text: ".", dir: "ltr", start: 13, end: 14 });
  assert.equal(runs.at(-2).text, "أحمد");
  assert.equal(runs.at(-2).dir, "rtl");
});

test("offets are UTF-16 indices into the original string", () => {
  const text = "Hi محمود!";
  for (const run of segments(text)) {
    assert.equal(text.slice(run.start, run.end), run.text);
  }
});

test("Arabic punctuation stays inside the Arabic run", () => {
  assert.deepEqual(shape("مرحبا، كيف حالك؟"), [["rtl", "مرحبا، كيف حالك؟"]]);
});

test("combining marks do not split a word", () => {
  const [run] = segments("مُحَمَّد");
  assert.equal(run.dir, "rtl");
  assert.equal(run.text, "مُحَمَّد");
});

test("Latin digits and their punctuation stay left to right inside Arabic", () => {
  assert.deepEqual(shape("السعر 123.45% فقط", "rtl"), [
    ["rtl", "السعر "],
    ["ltr", "123.45% "],
    ["rtl", "فقط"],
  ]);
});

test("Arabic-Indic digits belong to the Arabic run", () => {
  assert.deepEqual(shape("السعر ١٢٣ ريال", "rtl"), [["rtl", "السعر ١٢٣ ريال"]]);
});

test("a phone number keeps its left-to-right shape inside an Arabic sentence", () => {
  const runs = segments("اتصل +971 50 123 4567", "rtl");
  const digits = runs.find((run) => run.dir === "ltr");
  assert.equal(digits.text, "971 50 123 4567");
});

test("URLs, emails and hashtags stay whole where they are left to right", () => {
  assert.deepEqual(shape("email: a.mohamed@example.com"), [["ltr", "email: a.mohamed@example.com"]]);
  const url = segments("Visit https://example.com/عربي now");
  assert.equal(url[0].text, "Visit https://example.com/");
  assert.equal(url[0].dir, "ltr");
  const hashtag = segments("#عربي hashtag", "rtl");
  assert.equal(hashtag[0].dir, "rtl");
  assert.equal(hashtag[0].text, "#عربي ");
});

test("a French sentence with an Arabic name keeps the French full stop after the name", () => {
  assert.deepEqual(shape("Bonjour, أحمد. Ça va ?"), [
    ["ltr", "Bonjour, "],
    ["rtl", "أحمد"],
    ["ltr", ". Ça va ?"],
  ]);
});

test("guillemets around an Arabic word do not break it", () => {
  assert.deepEqual(shape("«مرحبا»", "rtl"), [["rtl", "«مرحبا»"]]);
});

test("the base direction decides where a trailing full stop goes", () => {
  assert.deepEqual(shape("نص English.", "ltr"), [
    ["rtl", "نص "],
    ["ltr", "English."],
  ]);
  assert.deepEqual(shape("نص English.", "rtl"), [
    ["rtl", "نص "],
    ["ltr", "English"],
    ["rtl", "."],
  ]);
});

test("without a base the first strong character decides, as the browser does", () => {
  // An Arabic base takes the full stop with it, the way the bidi algorithm does.
  assert.deepEqual(shape("مرحبا. English"), [
    ["rtl", "مرحبا. "],
    ["ltr", "English"],
  ]);
  assert.deepEqual(shape("Hello. مرحبا"), [
    ["ltr", "Hello. "],
    ["rtl", "مرحبا"],
  ]);
});

test("direction detection follows the first strong character", () => {
  assert.equal(detectDirection("Hello أحمد"), "ltr");
  assert.equal(detectDirection("أحمد Hello"), "rtl");
  assert.equal(detectDirection("123 456"), "ltr");
  assert.equal(detectDirection("..."), "neutral");
  assert.equal(detectDirection(""), "neutral");
  assert.equal(detectDirection("Été à Paris"), "ltr");
  assert.equal(resolveDirection("..."), "ltr");
  assert.equal(resolveDirection("مرحبا"), "rtl");
});

test("script probes", () => {
  assert.equal(hasRtl("hello"), false);
  assert.equal(hasRtl("hello مرحبا"), true);
  assert.equal(hasArabic("١٢٣"), false);
  assert.equal(hasArabic("نص ١٢٣"), true);
});

test("isolate wraps in the invisible isolate characters", () => {
  assert.equal(isolate("أحمد"), "\u2068أحمد\u2069");
  assert.equal(isolate("أحمد", { dir: "rtl" }), "\u2067أحمد\u2069");
  assert.equal(isolate("Ahmed", { dir: "ltr" }), "\u2066Ahmed\u2069");
  assert.equal(isolate(""), "");
});

test("isolateRunsText isolates each run for plain-text contexts", () => {
  assert.equal(isolateRunsText("Hello أحمد."), "\u2066Hello \u2069\u2067أحمد\u2069\u2066.\u2069");
});

test("every bidi control character is removed, and nothing else is touched", () => {
  const attacks = "\u202Eevil\u202C \u2066x\u2069 \u200F\u200E\u061C";
  const clean = stripBidiControls(attacks);
  assert.equal(clean, "evil x ");
  assert.equal(hasBidiControls("abc"), false);
  assert.equal(hasBidiControls("\u202Edoc.exe"), true);
  assert.equal(stripBidiControls("مرحبا, world!"), "مرحبا, world!");
});
