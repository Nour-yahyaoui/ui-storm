import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../test-utils/assertA11y';
import { render } from '../test-utils/render';
import { ColorTokensDemo, FocusIndicatorDemo, ShapeAndMotionDemo } from './Tokens.stories';
import { ScriptPairingDemo } from './Typography.stories';
import { BidiIsolationDemo, LogicalPropertiesDemo } from './WritingDirection.stories';

/**
 * Structural accessibility of the foundation pages themselves.
 *
 * jsdom cannot evaluate color contrast or layout, so those assertions live in
 * `tests/e2e/foundations-a11y.spec.ts`. Everything semantic — headings, names,
 * roles, labels, ARIA — is checked here on every pull request without a browser.
 */

const demos = [
  { name: 'Color tokens', Component: ColorTokensDemo },
  { name: 'Shape and motion', Component: ShapeAndMotionDemo },
  { name: 'Focus indicator', Component: FocusIndicatorDemo },
  { name: 'Logical properties', Component: LogicalPropertiesDemo },
  { name: 'Bidi isolation', Component: BidiIsolationDemo },
  { name: 'Script pairing', Component: ScriptPairingDemo },
];

describe.each(demos)('$name foundation page', ({ Component }) => {
  it('has no WCAG A/AA violations in LTR', async () => {
    const { container } = render(<Component />, { dir: 'ltr', locale: 'en' });
    await expectNoA11yViolations(container);
  });

  it('has no WCAG A/AA violations in RTL Arabic', async () => {
    const { container } = render(<Component />, { dir: 'rtl', locale: 'ar-EG' });
    await expectNoA11yViolations(container);
  });
});

describe('LogicalPropertiesDemo', () => {
  it('exposes the accent marker used to prove logical offsets', () => {
    render(<LogicalPropertiesDemo />);

    expect(screen.getByTestId('start-marker')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();
  });
});

describe('BidiIsolationDemo', () => {
  it('marks embedded Latin identifiers as bidi-isolated', () => {
    const { container } = render(<BidiIsolationDemo />, { dir: 'rtl', locale: 'ar-EG' });

    const isolated = container.querySelectorAll('bdi');
    expect(isolated.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the nested code sample LTR inside an RTL page', () => {
    render(<BidiIsolationDemo />, { dir: 'rtl', locale: 'ar-EG' });

    const pre = screen.getByText(/DirectionProvider locale=/);
    expect(pre.closest('[dir="ltr"]')).not.toBeNull();
  });
});

describe('ScriptPairingDemo', () => {
  it('marks Arabic paragraphs with an explicit lang attribute', () => {
    const { container } = render(<ScriptPairingDemo />);

    const arabicParagraphs = container.querySelectorAll('p[lang="ar"]');
    expect(arabicParagraphs.length).toBeGreaterThanOrEqual(2);
  });
});
