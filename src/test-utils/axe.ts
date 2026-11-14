import axe, { type AxeResults, type Result, type RunOptions } from 'axe-core';

/** Rules that need a real layout engine and cannot run under jsdom. */
export const JSDOM_UNSUPPORTED_RULES = ['color-contrast', 'color-contrast-enhanced', 'target-size'];

/** WCAG 2.2 levels A and AA, plus the A/AA criteria introduced in 2.1 and 2.2. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

export interface RunAxeOptions extends RunOptions {
  /** Extra rule ids to skip for this assertion, with a reason in the test. */
  allowlist?: string[];
}

export function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n');
      return `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}\n${nodes}\n    ${violation.helpUrl}`;
    })
    .join('\n\n');
}

/**
 * Runs axe-core against a container and returns WCAG A/AA violations.
 *
 * Contrast and target-size checks are reported by the Playwright suite (real
 * browser), not here — silently passing them in jsdom would be a lie.
 */
export async function runAxe(
  container: HTMLElement,
  options: RunAxeOptions = {},
): Promise<Result[]> {
  const { allowlist = [], ...runOptions } = options;

  const results: AxeResults = await axe.run(container, {
    ...runOptions,
    runOnly: runOptions.runOnly ?? { type: 'tag', values: WCAG_TAGS },
  });

  const skipped = new Set([...JSDOM_UNSUPPORTED_RULES, ...allowlist]);

  return results.violations.filter((violation) => !skipped.has(violation.id));
}
