import { useContext, useMemo } from 'react';
import { getInheritedDirection, type Direction } from '../lib/direction';
import { DirectionContext, type DirectionContextValue } from '../providers/direction-context';

/**
 * Reads the active writing direction.
 *
 * Works without a provider by falling back to the document's `dir` attribute, so
 * components can be dropped into an existing RTL application without wrapping
 * anything. During SSR it returns `ltr` and self-corrects after hydration.
 */
export function useDirection(): DirectionContextValue {
  const context = useContext(DirectionContext);

  const fallback = useMemo<DirectionContextValue>(() => {
    const inherited: Direction =
      typeof document === 'undefined' ? 'ltr' : (getInheritedDirection(null) ?? 'ltr');
    return { dir: inherited, locale: undefined, isRTL: inherited === 'rtl' };
  }, []);

  return context ?? fallback;
}
