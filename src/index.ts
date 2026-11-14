/**
 * Accessible UI Lab
 *
 * Public entry point. Components are added here as their issues land; today it
 * exposes the accessibility and bidirectional foundations every component builds on.
 */
import './styles/index.css';

export { cn, type ClassValue } from './lib/cn';
export {
  getDirectionFromLocale,
  getInheritedDirection,
  isRtlLocale,
  type Direction,
} from './lib/direction';
export {
  FOCUSABLE_SELECTOR,
  focusFirst,
  focusLast,
  getFocusableElements,
  getTabbableElements,
  isFocusable,
} from './lib/focus';
export { mergeRefs } from './lib/mergeRefs';

export { DirectionProvider, type DirectionProviderProps } from './providers/DirectionProvider';
export { DirectionContext, type DirectionContextValue } from './providers/direction-context';
export { useDirection } from './hooks/useDirection';
