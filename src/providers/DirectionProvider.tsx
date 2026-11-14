import { useContext, useMemo, type ReactNode } from 'react';
import { getDirectionFromLocale, type Direction } from '../lib/direction';
import { DirectionContext, type DirectionContextValue } from './direction-context';

export interface DirectionProviderProps {
  /** Explicit direction. Wins over anything derived from `locale`. */
  dir?: Direction;
  /** BCP-47 locale, e.g. `ar-EG`. Also set as `lang` so Arabic typography applies. */
  locale?: string;
  /** Extra classes for the wrapper element. */
  className?: string;
  /** Wrapper element. Use `'none'` for layouts where a wrapper would break flow. */
  as?: 'div' | 'span' | 'section' | 'none';
  children: ReactNode;
}

/**
 * Establishes writing direction and language for a subtree.
 *
 * It renders a wrapper carrying `dir` and `lang` so that:
 *  - CSS logical properties (`margin-inline-start`, `inset-inline-end`, ...) resolve;
 *  - the `:dir()` pseudo-class and the `rtl:` variant behave as authored;
 *  - Arabic typography rules (`:lang(ar)`) apply to descendants.
 *
 * Nested providers inherit locale and direction from the nearest parent unless
 * they override them, which is what makes an RTL page with an LTR code block work.
 */
export function DirectionProvider({
  dir,
  locale,
  className,
  as = 'div',
  children,
}: DirectionProviderProps) {
  const parent = useContext(DirectionContext);

  const resolvedLocale = locale ?? parent?.locale;
  const resolvedDir: Direction =
    dir ??
    (resolvedLocale ? getDirectionFromLocale(resolvedLocale) : undefined) ??
    parent?.dir ??
    'ltr';

  const value = useMemo<DirectionContextValue>(
    () => ({ dir: resolvedDir, locale: resolvedLocale, isRTL: resolvedDir === 'rtl' }),
    [resolvedDir, resolvedLocale],
  );

  if (as === 'none') {
    return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>;
  }

  const Wrapper = as;

  return (
    <DirectionContext.Provider value={value}>
      <Wrapper
        dir={resolvedDir}
        lang={resolvedLocale}
        className={className}
        data-aui-direction={resolvedDir}
      >
        {children}
      </Wrapper>
    </DirectionContext.Provider>
  );
}
