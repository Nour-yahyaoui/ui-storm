import assert from "node:assert/strict";
import test from "node:test";
import {
  ARABIC_FEATURES,
  CSS,
  FONT_STACKS,
  ROOT_CSS,
  UNICODE_RANGES,
  fontFace,
  fontFamilyRule,
  fontStack,
  inlineStyle,
} from "../dist/esm/index.js";

test("the Arabic stack starts with a face that has the glyphs", () => {
  assert.match(FONT_STACKS.arabic, /^"Noto Naskh Arabic"/);
  assert.match(FONT_STACKS.arabic, /sans-serif$/);
  assert.equal(fontStack("ar"), FONT_STACKS.arabic);
  assert.equal(fontStack("ar-TN"), FONT_STACKS.arabic);
  assert.equal(fontStack("fa"), FONT_STACKS.arabic);
  assert.equal(fontStack("he"), FONT_STACKS.hebrew);
  assert.equal(fontStack("fr"), FONT_STACKS.latin);
  assert.equal(fontStack(), FONT_STACKS.latin);
});

test("Arabic features include the joined forms that stop two-tone words", () => {
  for (const feature of ['"kern"', '"liga"', '"calt"', '"rlig"', '"init"', '"medi"', '"fina"']) {
    assert.ok(ARABIC_FEATURES.includes(feature), feature);
  }
});

test("a font face carries a unicode-range for its script", () => {
  const arabic = fontFace({ family: "Noto Naskh Arabic", src: 'url(/naskh.woff2) format("woff2")' });
  assert.match(arabic, /@font-face \{/);
  assert.match(arabic, /unicode-range: U\+0600-06FF/);
  assert.match(arabic, /font-display: swap/);
  const hebrew = fontFace({ family: "Noto Sans Hebrew", src: "local(Hebrew)", script: "hebrew" });
  assert.match(hebrew, /unicode-range: U\+0590-05FF/);
  const custom = fontFace({ family: "X", src: "local(X)", unicodeRange: "U+0600-060F" });
  assert.match(custom, /unicode-range: U\+0600-060F/);
  assert.ok(UNICODE_RANGES.latin.includes("U+0000-00FF"));
});

test("the stylesheet isolates, aligns by direction and gives Arabic room for its marks", () => {
  assert.match(CSS, /unicode-bidi: isolate/);
  assert.match(CSS, /text-align: start/);
  assert.match(CSS, /line-height: 1\.9/);
  assert.match(CSS, /font-feature-settings:/);
  assert.match(CSS, /\[lang\^="ar"\]/);
  assert.match(ROOT_CSS, /unicode-bidi: plaintext/);
});

test("inline styles and family rules are written, not guessed", () => {
  assert.equal(
    inlineStyle({ dir: "rtl", script: "arabic" }),
    `direction: rtl; unicode-bidi: isolate; font-family: ${FONT_STACKS.arabic}; font-feature-settings: ${ARABIC_FEATURES}; line-height: 1.9`,
  );
  assert.equal(fontFamilyRule("html[lang=ar]"), `html[lang=ar] {\n  font-family: ${FONT_STACKS.arabic};\n}`);
});
