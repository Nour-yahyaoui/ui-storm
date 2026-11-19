import type { Direction, Segment } from "./types.js";

/**
 * What a single character contributes to direction resolution.
 *
 * The distinction that matters is between *strong* characters, which decide a
 * run's direction, and weak ones, which are carried along by a neighbour. The
 * finer distinction — which neighbour — is what makes a full stop after an
 * Arabic name stay at the end of the English sentence instead of jumping to the
 * wrong side of the name, which is the single most common bidi complaint.
 */
type CharClass =
  /** A letter of a right-to-left script, and the right-to-left mark `U+200F`. */
  | "rtl"
  /** A letter of a left-to-right script, and the left-to-right mark `U+200E`. */
  | "ltr"
  /** Arabic-Indic digits and Arabic punctuation: they belong to an RTL run. */
  | "rtlWeak"
  /** ASCII and Latin digits: they read left to right even inside Arabic. */
  | "ltrWeak"
  /** Whitespace, combining marks and invisible controls: never decide anything. */
  | "join"
  /** Brackets, quotes and symbols: they take their direction from their neighbours. */
  | "neutral";

const RTL_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0700, 0x074f], // Syriac
  [0x0750, 0x077f], // Arabic Supplement
  [0x0780, 0x07bf], // Thaana
  [0x07c0, 0x07ff], // NKo
  [0x0800, 0x083f], // Samaritan
  [0x0840, 0x085f], // Mandaic
  [0x0860, 0x086f], // Syriac Supplement
  [0x0870, 0x08ff], // Arabic Extended-B and -A
  [0xfb1d, 0xfb4f], // Hebrew presentation forms
  [0xfb50, 0xfdff], // Arabic presentation forms A
  [0xfe70, 0xfeff], // Arabic presentation forms B
  [0x1e800, 0x1e8df], // Mende Kikakui
  [0x1e900, 0x1e95f], // Adlam
  [0x1ee00, 0x1eeff], // Arabic mathematical alphabetic symbols
];

/** Arabic comma, semicolon, question mark, percent and the rest of the set. */
const ARABIC_PUNCTUATION = /[\u060C\u061B\u061F\u066A-\u066D\u06D4]/u;
const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/u;
const ANY_DIGIT = /\p{Nd}/u;
const MARK = /\p{M}/u;
const WHITESPACE_OR_FORMAT = /[\s\p{Z}\p{M}\p{Cf}]/u;
/** A neutral that joins a number when it sits between two digits: `1,000.5%`. */
const NUMERIC_JOINER = /[.,:+\-\u066B\u066C]/u;
/** A percent sign is part of the number it follows, not a sentence of its own. */
const NUMERIC_SUFFIX = /[%\u2030\u066A]/u;

/** True when the code point belongs to a script written right to left. */
export function isRtlCodePoint(codePoint: number): boolean {
  for (const [start, end] of RTL_RANGES) {
    if (codePoint >= start && codePoint <= end) return true;
  }
  return false;
}

/** True when the string contains at least one right-to-left character. */
export function hasRtl(text: string): boolean {
  for (const char of text) {
    if (isRtlCodePoint(char.codePointAt(0) ?? 0)) return true;
  }
  return false;
}

/** True when the string contains Arabic letters, as opposed to just Arabic digits. */
export function hasArabic(text: string): boolean {
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    const inArabicScript =
      (codePoint >= 0x0600 && codePoint <= 0x06ff) ||
      (codePoint >= 0x0750 && codePoint <= 0x077f) ||
      (codePoint >= 0xfb50 && codePoint <= 0xfdff) ||
      (codePoint >= 0xfe70 && codePoint <= 0xfeff);
    if (inArabicScript && /\p{L}/u.test(char)) return true;
  }
  return false;
}

function baseClass(char: string): CharClass {
  if (char === "\u200f") return "rtl";
  if (char === "\u200e") return "ltr";
  if (ARABIC_DIGITS.test(char)) return "rtlWeak";
  if (ANY_DIGIT.test(char)) return "ltrWeak";
  if (MARK.test(char)) return "join";
  if (WHITESPACE_OR_FORMAT.test(char)) return "join";
  if (ARABIC_PUNCTUATION.test(char)) return "rtlWeak";
  if (isRtlCodePoint(char.codePointAt(0) ?? 0)) return "rtl";
  // Letters are what is left: a symbol or a bracket is neutral, a letter is not.
  return /\p{L}/u.test(char) ? "ltr" : "neutral";
}

function classAt(chars: readonly string[], index: number): CharClass {
  const char = chars[index] as string;
  const cls = baseClass(char);
  if (cls !== "neutral") return cls;
  const previous = chars[index - 1];
  const next = chars[index + 1];
  const numeric = (digit: string | undefined): CharClass | null =>
    digit === undefined || !ANY_DIGIT.test(digit)
      ? null
      : ARABIC_DIGITS.test(digit)
        ? "rtlWeak"
        : "ltrWeak";
  const beforeIsDigit = numeric(previous);
  if (beforeIsDigit === null) return cls;
  if (NUMERIC_SUFFIX.test(char)) return beforeIsDigit;
  if (!NUMERIC_JOINER.test(char)) return cls;
  return numeric(next) === null ? cls : beforeIsDigit;
}

/** A segment before neutral runs have been resolved; `neutral` is provisional. */
interface Draft {
  text: string;
  dir: Direction;
  start: number;
  end: number;
}

/**
 * Splits text into runs that each have one direction.
 *
 * The browser implements the Unicode bidi algorithm correctly; what it cannot
 * know is where the author meant a boundary to be. This answers that question,
 * and nothing else:
 *
 * - a strong character starts a run and decides its direction;
 * - Arabic digits and Arabic punctuation stay inside an Arabic run, so `مرحبا،`
 *   does not break in half;
 * - Latin digits read left to right even inside Arabic, so `123.45%` stays one
 *   piece;
 * - brackets, quotes and symbols are neutral: they take the direction of the
 *   runs on both sides when those agree, and otherwise the base direction — so
 *   an English full stop after an Arabic name ends the English sentence instead
 *   of moving to the wrong side of the name.
 *
 * Pass `base` when you know the paragraph direction — say, because the column
 * is Arabic and this is one row of it. By default the base is the direction of
 * the first strong character, which is what the browser would assume anyway.
 */
export function segments(text: string, base?: "ltr" | "rtl"): Segment[] {
  const fallback: "ltr" | "rtl" = base ?? (detectDirection(text) === "rtl" ? "rtl" : "ltr");
  const chars = Array.from(text);
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  let offset = 0;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] as string;
    const start = offset;
    const end = offset + char.length;
    offset = end;

    const cls = classAt(chars, index);
    const dir: Direction =
      cls === "rtl" || cls === "rtlWeak" ? "rtl" : cls === "ltr" || cls === "ltrWeak" ? "ltr" : cls === "join" ? (current ? current.dir : "neutral") : "neutral";

    if (current && current.dir === dir) {
      current.text += char;
      current.end = end;
      continue;
    }
    if (current) drafts.push(current);
    current = { text: char, dir, start, end };
  }
  if (current) drafts.push(current);

  const resolved = resolveNeutrals(drafts, fallback);
  return merge(resolved);
}

/** N1/N2 in miniature: a neutral takes the direction of agreeing neighbours, else the base. */
function resolveNeutrals(drafts: readonly Draft[], base: "ltr" | "rtl"): Draft[] {
  return drafts.map((draft, index) => {
    if (draft.dir !== "neutral") return draft;
    const before = previousDirection(drafts, index);
    const after = nextDirection(drafts, index);
    const fallback: Direction = before !== "neutral" && before === after ? before : base;
    return { ...draft, dir: fallback };
  });
}

function previousDirection(drafts: readonly Draft[], index: number): Direction {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const draft = drafts[cursor];
    if (draft && draft.dir !== "neutral") return draft.dir;
  }
  return "neutral";
}

function nextDirection(drafts: readonly Draft[], index: number): Direction {
  for (let cursor = index + 1; cursor < drafts.length; cursor += 1) {
    const draft = drafts[cursor];
    if (draft && draft.dir !== "neutral") return draft.dir;
  }
  return "neutral";
}

function merge(drafts: readonly Draft[]): Segment[] {
  const merged: Segment[] = [];
  for (const draft of drafts) {
    const last = merged[merged.length - 1];
    if (last && last.dir === draft.dir) {
      last.text += draft.text;
      last.end = draft.end;
      continue;
    }
    merged.push({ text: draft.text, dir: draft.dir, start: draft.start, end: draft.end });
  }
  return merged;
}

/**
 * The direction of the first strong character, which is what `dir="auto"`
 * resolves to. `neutral` means the text has no strong character at all.
 */
export function detectDirection(text: string): Direction {
  const chars = Array.from(text);
  for (let index = 0; index < chars.length; index += 1) {
    const cls = baseClass(chars[index] as string);
    if (cls === "rtl" || cls === "rtlWeak") return "rtl";
    if (cls === "ltr" || cls === "ltrWeak") return "ltr";
  }
  return "neutral";
}

/**
 * Like {@link detectDirection}, but resolves `neutral` to `ltr` — the same
 * fallback HTML uses for `dir="auto"`, so this is always safe to write to an
 * attribute.
 */
export function resolveDirection(text: string): "ltr" | "rtl" {
  return detectDirection(text) === "rtl" ? "rtl" : "ltr";
}
