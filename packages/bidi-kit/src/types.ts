/** The direction of a piece of text, as resolved by the bidi algorithm. */
export type Direction = "ltr" | "rtl" | "neutral";

/** A direction that can be written to an attribute: `auto` lets the browser infer it. */
export type AttributeDirection = Direction | "auto";

/** One run of text with a single resolved direction. */
export interface Segment {
  /** The text of the run, exactly as it appears in the input. */
  text: string;
  /** The run's direction. `neutral` means no strong character was found. */
  dir: Direction;
  /** Index of the first character, in UTF-16 code units. */
  start: number;
  /** Index just past the last character, in UTF-16 code units. */
  end: number;
}

/** Options for {@link isolate} and {@link toPlainIsolated}. */
export interface IsolateOptions {
  /**
   * Which isolate to wrap in. `auto` (the default) uses the first-strong
   * isolate, which lets the reader's own bidi algorithm decide.
   */
  dir?: AttributeDirection;
}

/** Options shared by the HTML helpers. */
export interface HtmlOptions {
  /** `auto` (the default) infers the element's direction from its content. */
  dir?: AttributeDirection;
  /** BCP-47 tag written to `lang`. */
  lang?: string;
  /** Extra class names. */
  class?: string;
  /** A `font-family` value applied as an inline style. */
  font?: string;
  /** Which element to emit. `<bdi>` (the default) isolates by design. */
  element?: "bdi" | "span";
}

/** A piece of a paragraph: a string, or an explicit run with its own direction. */
export type Part =
  | string
  | {
      text: string;
      dir?: AttributeDirection;
      lang?: string;
      /** A `font-family` value applied as an inline style. */
      font?: string;
    };

/** Options for {@link paragraph}. */
export interface ParagraphOptions {
  /** `auto` (the default) resolves from the content's first strong character. */
  dir?: AttributeDirection;
  /** BCP-47 tag written to `lang`. */
  lang?: string;
  /** Extra class names. */
  class?: string;
  /**
   * When true, string parts are treated as trusted HTML and inserted as-is.
   * Never use it with user input.
   */
  html?: boolean;
}

/** The smallest element shape {@link apply} needs, so it works without the DOM lib. */
export interface DirectionalElement {
  textContent: string | null;
  setAttribute?(name: string, value: string): void;
}

/** Font stacks for the scripts that meet in a mixed paragraph. */
export type Script = "arabic" | "hebrew" | "latin";

/** Options for {@link fontFace}. */
export interface FontFaceOptions {
  /** The family name used in `src` and in the stack. */
  family: string;
  /** One or more `url(...)` or `local(...)` sources. */
  src: string | string[];
  /** Which script the face covers; decides the generated `unicode-range`. */
  script?: Script;
  weight?: string | number;
  style?: string;
  display?: "auto" | "block" | "swap" | "fallback" | "optional";
  /** Overrides the generated `unicode-range`. */
  unicodeRange?: string;
  /** Nudges the rendered size for a fallback face, in percent. */
  sizeAdjust?: string;
}

export type AuditRule =
  | "bidi-control-character"
  | "inline-direction-without-isolation"
  | "physical-css-property"
  | "physical-text-align"
  | "document-without-lang";

/** One finding from {@link audit}. */
export interface AuditIssue {
  rule: AuditRule;
  severity: "error" | "warning";
  message: string;
  /** Index of the match in the audited string, in UTF-16 code units. */
  index: number;
  /** The offending text, truncated to keep output readable. */
  snippet: string;
}
