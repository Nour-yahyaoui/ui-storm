import { segments } from "./segment.js";
import type { AttributeDirection } from "./types.js";

/** Left-to-right isolate. */
export const LRI = "\u2066";
/** Right-to-left isolate. */
export const RLI = "\u2067";
/** First-strong isolate: the reader's bidi algorithm picks the direction. */
export const FSI = "\u2068";
/** Pop directional isolate. */
export const PDI = "\u2069";

/** Every character that can change the visual order without being visible. */
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Wraps text in an isolate, for plain-text contexts where an element is not an
 * option: an `aria-label`, a canvas, a terminal, a spreadsheet cell, a JSON
 * field that something else will render.
 *
 * In HTML, prefer {@link bdi} — an element is inspectable, stylable and cannot
 * leak a stray `PDI` when a string is concatenated badly.
 */
export function isolate(text: string, options: IsolateOptions = {}): string {
  if (text === "") return "";
  const dir = options.dir ?? "auto";
  if (dir === "rtl") return RLI + text + PDI;
  if (dir === "ltr") return LRI + text + PDI;
  return FSI + text + PDI;
}

/** Options for {@link isolate}. */
export interface IsolateOptions {
  dir?: AttributeDirection;
}

/** True when the string carries invisible bidi control characters. */
export function hasBidiControls(text: string): boolean {
  return /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u.test(text);
}

/**
 * Removes every invisible bidi control character.
 *
 * Use this on anything a stranger wrote. Overrides and isolates are the raw
 * material of display-spoofing bugs — the class of attack that turned source
 * code review into a guessing game — and a text field that passes them through
 * to a terminal, a diff or a filename is a bug, not a feature.
 */
export function stripBidiControls(text: string): string {
  return text.replace(BIDI_CONTROLS, "");
}

/**
 * Rewrites text so each run is explicitly isolated, for plain-text output.
 *
 * Unlike {@link isolate}, which wraps the whole string, this keeps an English
 * sentence readable by a terminal that only understands the bidi algorithm: the
 * Arabic run gets an RLI/PDI pair and everything else is left alone.
 */
export function isolateRunsText(text: string): string {
  return segments(text)
    .map((segment) => {
      if (segment.dir === "rtl") return RLI + segment.text + PDI;
      if (segment.dir === "ltr") return LRI + segment.text + PDI;
      return segment.text;
    })
    .join("");
}

/** The invisible characters, exported so a UI can explain what it stripped. */
export const BIDI_CONTROL_CHARACTERS = [
  "\u061C",
  "\u200E",
  "\u200F",
  "\u202A",
  "\u202B",
  "\u202C",
  "\u202D",
  "\u202E",
  "\u2066",
  "\u2067",
  "\u2068",
  "\u2069",
] as const;
