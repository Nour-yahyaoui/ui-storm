import { createContext } from 'react';
import type { Direction } from '../lib/direction';

export interface DirectionContextValue {
  /** Writing direction in effect for this subtree. */
  dir: Direction;
  /** BCP-47 locale in effect, when one was provided. */
  locale: string | undefined;
  /** Convenience flag: `dir === 'rtl'`. */
  isRTL: boolean;
}

/**
 * `null` means "no provider in the tree" so `useDirection` can fall back to the
 * document direction instead of silently guessing.
 */
export const DirectionContext = createContext<DirectionContextValue | null>(null);
