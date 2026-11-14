import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from './assertA11y';
import { formatViolations, runAxe } from './axe';

/**
 * These tests guard the guard: if the harness stops reporting real violations,
 * every "a11y test passed" claim in this repository becomes meaningless.
 */
describe('axe harness', () => {
  it('reports a real violation (image without alternative text)', async () => {
    const { container } = render(<img src="/logo.png" alt="" role="presentation" />);

    const violations = await runAxe(container, { allowlist: [] });

    // An empty alt with presentation role is valid; the same image without alt is not.
    expect(violations).toHaveLength(0);

    // Built as raw markup so the repository's own jsx-a11y lint rule does not
    // (correctly) reject the intentionally broken example above.
    const broken = document.createElement('div');
    broken.innerHTML = '<img src="/logo.png">';
    document.body.append(broken);

    const brokenViolations = await runAxe(broken);

    expect(brokenViolations.map((violation) => violation.id)).toContain('image-alt');
    await expect(expectNoA11yViolations(broken)).rejects.toThrow(/Accessibility violations/);
  });

  it('reports incomplete labelling of form controls', async () => {
    const { container } = render(<input type="text" />);

    const violations = await runAxe(container);

    expect(violations.map((violation) => violation.id)).toContain('label');
  });

  it('formats violations for humans', async () => {
    const { container } = render(<input type="email" />);
    const violations = await runAxe(container);

    const report = formatViolations(violations);

    expect(report).toContain('label');
    expect(report).toContain('https://');
  });

  it('skips the rules documented as unsupported in jsdom', async () => {
    const { container } = render(<button type="button">ok</button>);
    const violations = await runAxe(container);

    expect(violations.map((violation) => violation.id)).not.toContain('color-contrast');
  });
});
