import type { AuditIssue, AuditRule } from "./types.js";

interface Rule {
  id: AuditRule;
  severity: "error" | "warning";
  pattern: RegExp;
  message: string;
}

const RULES: readonly Rule[] = [
  {
    id: "bidi-control-character",
    severity: "error",
    pattern: /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu,
    message:
      "Invisible bidi control character. It reorders text without showing why; strip it from anything a stranger wrote.",
  },
  {
    id: "inline-direction-without-isolation",
    severity: "warning",
    pattern: /<span[^>]*\bdir=/giu,
    message:
      "<span dir=...> does not isolate. Use <bdi>, or add unicode-bidi: isolate to the rule.",
  },
  {
    id: "physical-text-align",
    severity: "warning",
    pattern: /text-align\s*:\s*(left|right)\b/giu,
    message: "text-align: left/right is physical. Use start/end so Arabic paragraphs align correctly.",
  },
  {
    id: "physical-css-property",
    severity: "warning",
    pattern: /\b(padding|margin|border)-(left|right)\b/giu,
    message:
      "Logical properties (padding-inline-start, margin-inline-end, border-inline-start) mirror with direction.",
  },
  {
    id: "document-without-lang",
    severity: "warning",
    pattern: /<html(?![^>]*\blang=)[^>]*>/giu,
    message: "<html> has no lang. Screen readers pick a voice from it, and Arabic is unreadable in an English voice.",
  },
];

/**
 * Reports the markers that predict a bidi bug, for a string of HTML or CSS.
 *
 * This is a lint, not a proof: it finds patterns that are almost always wrong
 * and never claims a document that passes is correct. It is meant for a CI step
 * on content, and for the moment a translator asks why their paragraph is
 * backwards.
 */
export function audit(source: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const index = match.index ?? 0;
      issues.push({
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        index,
        snippet: source.slice(index, index + 40),
      });
    }
  }
  return issues.sort((a, b) => a.index - b.index);
}

/** Formats {@link audit} output as one line per finding, for a terminal. */
export function formatAudit(issues: readonly AuditIssue[], file?: string): string {
  if (issues.length === 0) return "no bidi issues found";
  return issues
    .map((issue) => {
      const where = file ? `${file}: ` : "";
      return `${where}[${issue.severity}] ${issue.rule} at ${issue.index}: ${issue.message}`;
    })
    .join("\n");
}
