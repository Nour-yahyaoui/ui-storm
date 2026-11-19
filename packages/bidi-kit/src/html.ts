import { resolveDirection } from "./segment.js";
import type {
  AttributeDirection,
  DirectionalElement,
  HtmlOptions,
  ParagraphOptions,
  Part,
} from "./types.js";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for use as element content or in a quoted attribute value. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function attribute(name: string, value: string | undefined): string {
  return value === undefined || value === "" ? "" : ` ${name}="${escapeHtml(value)}"`;
}

function styleValue(font: string | undefined): string | undefined {
  return font ? `font-family: ${font}` : undefined;
}

/**
 * A `<bdi>` element wrapping `text`.
 *
 * `<bdi>` is the one HTML element whose whole job is this problem: it isolates
 * its content from the surrounding paragraph, so neither the reader's text nor
 * the browser's bidi algorithm can drag a neighbouring word into the wrong
 * place. Reach for it before reaching for a mark you cannot see.
 */
export function bdi(text: string, options: HtmlOptions = {}): string {
  return inline(text, { ...options, element: options.element ?? "bdi" });
}

/** A `<span dir>` that isolates by style instead of by element. */
export function inline(text: string, options: HtmlOptions = {}): string {
  const element = options.element ?? "span";
  const dir: AttributeDirection = options.dir ?? "auto";
  const attributes = [
    dir === "auto" && element === "bdi" ? "" : attribute("dir", dir),
    attribute("lang", options.lang),
    attribute("class", options.class),
    attribute("style", styleValue(options.font)),
  ].join("");
  return `<${element}${attributes}>${escapeHtml(text)}</${element}>`;
}

/**
 * Builds one paragraph out of mixed parts.
 *
 * Named parts get an explicit direction and, if you pass one, a font: that is
 * how an Arabic sentence in a French paragraph ends up in a face that actually
 * has the glyphs, instead of a fallback the operating system picked without
 * asking. Strings are treated as plain text and escaped unless `html` is set.
 */
export function paragraph(parts: readonly Part[], options: ParagraphOptions = {}): string {
  const plain = parts
    .map((part) => {
      const text = typeof part === "string" ? part : part.text;
      // The direction of a paragraph comes from its words, not from its tags.
      return options.html ? text.replace(/<[^>]*>/g, " ") : text;
    })
    .join("");
  const dir: AttributeDirection =
    options.dir === undefined || options.dir === "auto" ? resolveDirection(plain) : options.dir;

  const body = parts
    .map((part) => {
      if (typeof part === "string") return options.html ? part : escapeHtml(part);
      const attributes = [
        attribute("dir", part.dir ?? "auto"),
        attribute("lang", part.lang),
        attribute("style", styleValue(part.font)),
      ].join("");
      const inner = options.html ? part.text : escapeHtml(part.text);
      return `<bdi${attributes}>${inner}</bdi>`;
    })
    .join("");

  const attributes = [
    attribute("dir", dir),
    attribute("lang", options.lang),
    attribute("class", options.class),
  ].join("");

  return `<p${attributes}>${body}</p>`;
}

/**
 * Sets element text and direction in one call. The container decides the
 * paragraph's base direction; each run inside it is left to the bidi
 * algorithm, which is what makes an English sentence with an Arabic name look
 * like an English sentence.
 */
export function apply(
  element: DirectionalElement,
  text: string,
  options: { dir?: AttributeDirection } = {},
): DirectionalElement {
  element.textContent = text;
  element.setAttribute?.("dir", options.dir ?? resolveDirection(text));
  return element;
}
