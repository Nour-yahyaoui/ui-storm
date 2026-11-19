import { ARABIC_FEATURES, FONT_STACKS } from "./fonts.js";

/**
 * The rules that keep mixed-script text from breaking, as a string you can
 * drop in a `<style>` tag or a stylesheet.
 *
 * Every line here fixes a specific, reproducible glitch:
 *
 * - `unicode-bidi: isolate` stops an inline element's direction from leaking
 *   into its neighbours;
 * - `text-align: start` makes alignment follow the text instead of the page —
 *   `left` is a bug the moment one paragraph is Arabic;
 * - the line-height on Arabic blocks is not aesthetics: naskh faces put marks
 *   above and below the baseline, and a 1.2 line-height cuts them off;
 * - `white-space: normal` (and no `text-overflow: ellipsis` on RTL) keeps a
 *   wrapped Arabic sentence from being reordered across lines.
 */
export const CSS = `:where([dir], [lang]):not(html, body) { unicode-bidi: isolate; }
[dir="rtl"] { text-align: right; direction: rtl; }
[dir="ltr"] { text-align: left; direction: ltr; }
[dir="auto"] { text-align: start; }
:where([lang^="ar"], [lang^="fa"], [lang^="ur"], [lang^="ps"], .script-arabic) {
  font-family: ${FONT_STACKS.arabic};
  font-feature-settings: ${ARABIC_FEATURES};
  line-height: 1.9;
}
:where([lang^="he"], [lang^="yi"], .script-hebrew) {
  font-family: ${FONT_STACKS.hebrew};
  line-height: 1.7;
}
:where(bdi, [dir="auto"]) { unicode-bidi: isolate; }
`;

/**
 * Rules to add once, on `html` or `body`, when a page mixes scripts and wants
 * the browser to stop guessing.
 */
export const ROOT_CSS = `html { unicode-bidi: plaintext; }
body { text-align: start; }
:lang(ar) { font-variant-numeric: normal; }
`;

/** A single declaration block for one element, for inline-style applications. */
export function inlineStyle(options: {
  dir?: "ltr" | "rtl" | "auto";
  script?: "arabic" | "hebrew" | "latin";
} = {}): string {
  const declarations: string[] = [];
  if (options.dir) {
    declarations.push(`direction: ${options.dir === "auto" ? "inherit" : options.dir}`);
    declarations.push("unicode-bidi: isolate");
  }
  if (options.script) {
    declarations.push(`font-family: ${FONT_STACKS[options.script]}`);
    if (options.script === "arabic") {
      declarations.push(`font-feature-settings: ${ARABIC_FEATURES}`);
      declarations.push("line-height: 1.9");
    }
  }
  return declarations.join("; ");
}
