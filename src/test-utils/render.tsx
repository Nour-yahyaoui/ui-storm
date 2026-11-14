import { render as rtlRender, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { Direction } from '../lib/direction';
import { DirectionProvider } from '../providers/DirectionProvider';

export interface RenderWithDirectionOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Writing direction for the rendered subtree. Defaults to `ltr`. */
  dir?: Direction;
  /** BCP-47 locale applied as `lang`. Defaults to `en`. */
  locale?: string;
}

/**
 * Renders a component inside a `DirectionProvider`.
 *
 * Every component test should use this instead of raw `render` so both
 * directions are covered by default; the `dir` option is what the RTL test
 * suites flip.
 */
export function renderWithDirection(
  ui: ReactElement,
  { dir = 'ltr', locale = 'en', ...options }: RenderWithDirectionOptions = {},
): RenderResult {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DirectionProvider dir={dir} locale={locale}>
      {children}
    </DirectionProvider>
  );

  return rtlRender(ui, { wrapper, ...options });
}

export { renderWithDirection as render };
export * from '@testing-library/react';
