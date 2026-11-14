import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  it('writes the value to object refs', () => {
    const ref = createRef<HTMLButtonElement>();
    const element = document.createElement('button');

    mergeRefs(ref)(element);

    expect(ref.current).toBe(element);
  });

  it('calls callback refs', () => {
    const callback = vi.fn();
    const element = document.createElement('button');

    mergeRefs(callback)(element);

    expect(callback).toHaveBeenCalledWith(element);
  });

  it('supports both kinds at once and tolerates null refs', () => {
    const ref = createRef<HTMLButtonElement>();
    const callback = vi.fn();
    const element = document.createElement('button');

    mergeRefs(ref, null, undefined, callback)(element);

    expect(ref.current).toBe(element);
    expect(callback).toHaveBeenCalledWith(element);
  });

  it('forwards null when the element unmounts', () => {
    const ref = createRef<HTMLButtonElement>();
    mergeRefs(ref)(document.createElement('button'));

    mergeRefs(ref)(null);

    expect(ref.current).toBeNull();
  });
});
