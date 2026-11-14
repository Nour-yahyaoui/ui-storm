import { describe, expect, it } from 'vitest';
import { getDirectionFromLocale, getInheritedDirection, isRtlLocale } from './direction';

describe('getDirectionFromLocale', () => {
  it.each([
    ['ar', 'rtl'],
    ['ar-EG', 'rtl'],
    ['ar_SA', 'rtl'],
    ['he-IL', 'rtl'],
    ['fa-IR', 'rtl'],
    ['ur-PK', 'rtl'],
    ['ps-AF', 'rtl'],
    ['ckb-IQ', 'rtl'],
    ['yi', 'rtl'],
    ['en', 'ltr'],
    ['en-US', 'ltr'],
    ['fr', 'ltr'],
    ['tr', 'ltr'],
  ])('maps %s to %s', (locale, expected) => {
    expect(getDirectionFromLocale(locale)).toBe(expected);
  });

  it('lets the script subtag override the language', () => {
    expect(getDirectionFromLocale('az-Arab')).toBe('rtl');
    expect(getDirectionFromLocale('ku-Latn')).toBe('ltr');
    expect(getDirectionFromLocale('pa-Arab-PK')).toBe('rtl');
  });

  it('handles casing and surrounding whitespace', () => {
    expect(getDirectionFromLocale('  AR-eg  ')).toBe('rtl');
  });

  it('falls back to ltr for empty, null and malformed input', () => {
    expect(getDirectionFromLocale(undefined)).toBe('ltr');
    expect(getDirectionFromLocale(null)).toBe('ltr');
    expect(getDirectionFromLocale('')).toBe('ltr');
    expect(getDirectionFromLocale('-')).toBe('ltr');
  });
});

describe('isRtlLocale', () => {
  it('is true for Arabic and false for English', () => {
    expect(isRtlLocale('ar')).toBe(true);
    expect(isRtlLocale('en')).toBe(false);
  });
});

describe('getInheritedDirection', () => {
  it('reads dir from the document element', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    expect(getInheritedDirection(null)).toBe('rtl');
  });

  it('climbs to the nearest ancestor with a dir attribute', () => {
    const outer = document.createElement('div');
    outer.setAttribute('dir', 'rtl');
    const inner = document.createElement('span');
    const leaf = document.createElement('b');
    inner.append(leaf);
    outer.append(inner);
    document.body.append(outer);

    expect(getInheritedDirection(leaf)).toBe('rtl');
  });

  it('treats dir="auto" as undetermined', () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('dir', 'auto');
    const child = document.createElement('span');
    wrapper.append(child);
    document.body.append(wrapper);

    expect(getInheritedDirection(child)).toBeNull();
  });

  it('returns null when nothing declares a direction', () => {
    expect(getInheritedDirection(null)).toBeNull();
  });
});
