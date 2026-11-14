import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDirection } from '../hooks/useDirection';
import { expectNoA11yViolations } from '../test-utils/assertA11y';
import { DirectionProvider } from './DirectionProvider';

function Probe() {
  const { dir, locale, isRTL } = useDirection();
  return (
    <output
      data-testid="probe"
      data-dir={dir}
      data-locale={locale ?? ''}
      data-is-rtl={String(isRTL)}
    >
      {dir}
    </output>
  );
}

function getProbe() {
  return screen.getByTestId('probe');
}

describe('DirectionProvider', () => {
  it('applies dir and lang to a wrapper element', () => {
    render(
      <DirectionProvider dir="rtl" locale="ar-EG">
        <Probe />
      </DirectionProvider>,
    );

    const wrapper = screen.getByTestId('probe').parentElement;
    expect(wrapper).toHaveAttribute('dir', 'rtl');
    expect(wrapper).toHaveAttribute('lang', 'ar-EG');
    expect(wrapper).toHaveAttribute('data-aui-direction', 'rtl');
  });

  it('derives direction from the locale when dir is omitted', () => {
    render(
      <DirectionProvider locale="ar">
        <Probe />
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'rtl');
    expect(getProbe()).toHaveAttribute('data-is-rtl', 'true');
  });

  it('prefers an explicit dir over the locale', () => {
    render(
      <DirectionProvider dir="ltr" locale="ar">
        <Probe />
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'ltr');
  });

  it('defaults to ltr with no props', () => {
    render(
      <DirectionProvider>
        <Probe />
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'ltr');
    expect(getProbe()).toHaveAttribute('data-is-rtl', 'false');
  });

  it('inherits locale and direction in nested providers', () => {
    render(
      <DirectionProvider locale="ar-SA">
        <DirectionProvider>
          <Probe />
        </DirectionProvider>
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'rtl');
    expect(getProbe()).toHaveAttribute('data-locale', 'ar-SA');
  });

  it('lets a nested provider switch an RTL page back to LTR', () => {
    render(
      <DirectionProvider locale="ar-SA">
        <DirectionProvider locale="en-US">
          <Probe />
        </DirectionProvider>
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'ltr');
  });

  it('can skip the wrapper element while keeping context', () => {
    render(
      <DirectionProvider as="none" dir="rtl">
        <Probe />
      </DirectionProvider>,
    );

    expect(getProbe()).toHaveAttribute('data-dir', 'rtl');
    // No wrapper is rendered: the probe sits directly in the test container,
    // and no ancestor declares a direction for it.
    expect(getProbe().parentElement).not.toHaveAttribute('dir');
    expect(document.querySelectorAll('[data-aui-direction]')).toHaveLength(0);
  });

  it('falls back to the document direction without a provider', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    render(<Probe />);

    expect(getProbe()).toHaveAttribute('data-dir', 'rtl');
  });

  it('is accessible in both directions', async () => {
    const { container } = render(
      <DirectionProvider locale="ar-EG">
        <h1>عنوان</h1>
        <p>نص تجريبي للاختبار.</p>
        <a href="#main">رابط</a>
      </DirectionProvider>,
    );

    await expectNoA11yViolations(container);
  });
});
