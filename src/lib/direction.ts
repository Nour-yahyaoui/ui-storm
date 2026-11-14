export type Direction = 'ltr' | 'rtl';

/**
 * Languages written right-to-left. Kept as a set of base language subtags so
 * regional variants (`ar-EG`, `ar-SA`, `az-Arab`) all resolve correctly.
 *
 * @see https://www.unicode.org/reports/tr9/ (Unicode Bidirectional Algorithm)
 */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'arc', // Aramaic
  'ckb', // Central Kurdish (Sorani)
  'dv', // Dhivehi
  'fa', // Persian
  'he', // Hebrew
  'iw', // Hebrew (legacy)
  'ji', // Yiddish (legacy)
  'khw', // Khowar
  'ks', // Kashmiri
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

/** Script subtags that force RTL regardless of the base language. */
const RTL_SCRIPTS = new Set(['arab', 'aran', 'hebr', 'syrc', 'thaa', 'nkoo', 'adlm']);

/**
 * Resolves the writing direction for a BCP-47 locale tag.
 *
 * The script subtag wins over the language: `az-Arab` is RTL even though
 * Azerbaijani is normally LTR. Malformed or unknown tags fall back to `ltr`.
 */
export function getDirectionFromLocale(locale: string | undefined | null): Direction {
  if (!locale) return 'ltr';

  const subtags = locale.trim().toLowerCase().replace(/_/g, '-').split('-').filter(Boolean);

  const language = subtags[0];
  if (!language) return 'ltr';

  const script = subtags.find((tag) => tag.length === 4 && RTL_SCRIPTS.has(tag));
  if (script) return 'rtl';

  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}

/** True when the locale is written right-to-left. */
export function isRtlLocale(locale: string | undefined | null): boolean {
  return getDirectionFromLocale(locale) === 'rtl';
}

/**
 * Returns the current direction of the closest ancestor that declares one.
 * Returns `null` when nothing in the tree declares a direction, so callers can
 * decide their own default.
 */
export function getInheritedDirection(element: Element | null): Direction | null {
  if (typeof document === 'undefined') return null;

  let current: Element | null = element ?? document.documentElement;

  while (current) {
    const value = current.getAttribute('dir')?.toLowerCase();
    if (value === 'ltr' || value === 'rtl') return value;
    if (value === 'auto') return null;
    current = current.parentElement;
  }

  return null;
}
