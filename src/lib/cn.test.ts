import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values and empty strings', () => {
    expect(cn('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  it('flattens nested arrays', () => {
    expect(cn('a', ['b', ['c', null]], 'd')).toBe('a b c d');
  });

  it('keeps keys whose value is truthy in objects', () => {
    expect(cn({ a: true, b: false, c: undefined, d: null }, 'e')).toBe('a e');
  });

  it('returns an empty string when nothing is provided', () => {
    expect(cn()).toBe('');
    expect(cn(null, false, {})).toBe('');
  });
});
