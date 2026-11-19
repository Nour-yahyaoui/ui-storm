import type { FontFaceOptions, Script } from "./types.js";

/**
 * Font stacks per script.
 *
 * Two failures produce the "broken Arabic" look people blame on bidi:
 *
 * 1. the Latin face has no Arabic glyphs, so the browser falls back per glyph —
 *    the word changes shape halfway through and the diacritics sit too low;
 * 2. the Arabic face is a *naskh* text face rendered at a Latin line-height,
 *    and the kasra, the hamza below and the tail of a final yeh are clipped.
 *
 * The stacks below put a known-good Arabic face first, keep a Latin face that
 * does not interfere, and end in `sans-serif` rather than in nothing.
 */
export const FONT_STACKS: Readonly<Record<Script, string>> = {
  arabic: [
    '"Noto Naskh Arabic"',
    '"Noto Sans Arabic"',
    '"Amiri"',
    '"Scheherazade New"',
    '"Geeza Pro"',
    '"Segoe UI"',
    '"Noto Sans"',
    "sans-serif",
  ].join(", "),
  hebrew: ['"Noto Sans Hebrew"', '"Arial Hebrew"', '"Gisha"', '"David CLM"', "sans-serif"].join(", "),
  latin: ['"Noto Sans"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"].join(", "),
};

/** The stack to use for a locale tag; anything not RTL gets the Latin stack. */
export function fontStack(locale?: string): string {
  if (!locale) return FONT_STACKS.latin;
  const language = locale.toLowerCase().split(/[-_]/)[0] ?? "";
  if (language === "ar" || language === "fa" || language === "ur" || language === "ps") {
    return FONT_STACKS.arabic;
  }
  if (language === "he" || language === "yi") return FONT_STACKS.hebrew;
  return FONT_STACKS.latin;
}

/** The `font-feature-settings` that keep Arabic words from looking two-tone. */
export const ARABIC_FEATURES =
  '"kern" 1, "liga" 1, "calt" 1, "rlig" 1, "init" 1, "medi" 1, "fina" 1';

/**
 * The `unicode-range` for a script, so a downloaded face is only fetched for
 * the characters it actually covers. Without it, a page with one Arabic
 * headline downloads the Arabic font for every reader.
 */
export const UNICODE_RANGES: Readonly<Record<Script, string>> = {
  arabic:
    "U+0600-06FF, U+0750-077F, U+0870-088E, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+1EE00-1EEFF",
  hebrew: "U+0590-05FF, U+FB1D-FB4F",
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193",
};

/**
 * Builds an `@font-face` rule.
 *
 * It is deliberately a string and not a file: the package ships no fonts, so a
 * consumer decides where the bytes come from — a local install, a CDN, or a
 * self-hosted file — and this only removes the chance of getting the
 * `unicode-range` and the metrics wrong while doing it.
 */
export function fontFace(options: FontFaceOptions): string {
  const script = options.script ?? "arabic";
  const sources = Array.isArray(options.src) ? options.src : [options.src];
  const lines = [
    `  font-family: "${options.family}";`,
    `  src: ${sources.join(", ")};`,
    `  font-weight: ${options.weight ?? "400"};`,
    `  font-style: ${options.style ?? "normal"};`,
    `  font-display: ${options.display ?? "swap"};`,
    `  unicode-range: ${options.unicodeRange ?? UNICODE_RANGES[script]};`,
  ];
  if (options.sizeAdjust) lines.push(`  size-adjust: ${options.sizeAdjust};`);
  return `@font-face {\n${lines.join("\n")}\n}`;
}

/** A `font-family` declaration that pairs an Arabic face with a Latin one. */
export function fontFamilyRule(selector: string, script: Script = "arabic"): string {
  return `${selector} {\n  font-family: ${FONT_STACKS[script]};\n}`;
}
