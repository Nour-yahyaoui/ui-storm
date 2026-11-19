/**
 * bidi-kit — mixed-direction text that behaves.
 *
 * The browser already implements the Unicode bidi algorithm correctly. What it
 * cannot know is where the author meant a boundary to be, which face has the
 * glyphs, or that a paragraph is Arabic until it has read the first character.
 * This package supplies those answers, and nothing else: no runtime
 * dependencies, no fonts, no framework.
 */

export { segments, detectDirection, resolveDirection, hasRtl, hasArabic, isRtlCodePoint } from "./segment.js";

export {
  isolate,
  isolateRunsText,
  hasBidiControls,
  stripBidiControls,
  BIDI_CONTROL_CHARACTERS,
  LRI,
  RLI,
  FSI,
  PDI,
} from "./isolate.js";

export { bdi, inline, paragraph, escapeHtml, apply } from "./html.js";

export {
  FONT_STACKS,
  ARABIC_FEATURES,
  UNICODE_RANGES,
  fontStack,
  fontFace,
  fontFamilyRule,
} from "./fonts.js";

export { CSS, ROOT_CSS, inlineStyle } from "./css.js";

export { audit, formatAudit } from "./audit.js";

export type {
  Direction,
  AttributeDirection,
  Segment,
  IsolateOptions,
  HtmlOptions,
  ParagraphOptions,
  Part,
  Script,
  FontFaceOptions,
  AuditRule,
  AuditIssue,
  DirectionalElement,
} from "./types.js";
