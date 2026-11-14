import { expect } from 'vitest';
import { formatViolations, runAxe, type RunAxeOptions } from './axe';

/**
 * Fails the test with a readable axe report when WCAG A/AA violations exist.
 *
 * ```ts
 * await expectNoA11yViolations(document.body);
 * ```
 */
export async function expectNoA11yViolations(
  container: HTMLElement = document.body,
  options?: RunAxeOptions,
): Promise<void> {
  const violations = await runAxe(container, options);

  expect(
    violations,
    violations.length > 0 ? `Accessibility violations:\n\n${formatViolations(violations)}` : '',
  ).toHaveLength(0);
}
