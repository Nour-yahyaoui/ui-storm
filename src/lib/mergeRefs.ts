import type { Ref, RefCallback } from 'react';

/**
 * Combines several refs into one callback ref so a component can accept a
 * consumer `ref` and still keep an internal reference (focus management, sizing).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined | null>): RefCallback<T> {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === 'function') {
        ref(value);
        continue;
      }

      ref.current = value;
    }
  };
}
