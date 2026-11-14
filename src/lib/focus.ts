/**
 * Focus utilities shared by every interactive component (Dialog, Menu, Tabs,
 * Combobox, ...). They are deliberately DOM-only so they can be unit tested in
 * jsdom and reused by the Playwright suite.
 */

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]',
  '[tabindex]',
].join(',');

function isDisabled(element: Element): boolean {
  if (element.hasAttribute('disabled')) return true;
  if (element.getAttribute('aria-disabled') === 'true') return true;
  const fieldset = element.closest('fieldset[disabled]');
  return Boolean(fieldset && !element.closest('legend'));
}

function isHidden(element: Element): boolean {
  if (element.hasAttribute('hidden')) return true;
  if (element.getAttribute('aria-hidden') === 'true') return true;
  if (element.closest('[inert]')) return true;

  const style =
    typeof globalThis.getComputedStyle === 'function' ? getComputedStyle(element) : null;
  if (style) {
    if (style.display === 'none') return true;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return true;
  }

  return false;
}

/** True when the element can receive programmatic focus. */
export function isFocusable(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) return false;
  if (!element.matches(FOCUSABLE_SELECTOR)) return false;
  if (isDisabled(element)) return false;
  if (isHidden(element)) return false;
  return true;
}

/**
 * Elements included in the sequential tab order (`tabindex >= 0`), sorted the
 * way browsers visit them: positive tabindex first, ascending, then the rest in
 * DOM order.
 */
export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

  const tabbable = candidates.filter((element) => {
    if (!isFocusable(element)) return false;
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null) {
      const parsed = Number.parseInt(tabindex, 10);
      return Number.isNaN(parsed) ? false : parsed >= 0;
    }
    return true;
  });

  return tabbable
    .map((element, domIndex) => ({
      element,
      domIndex,
      tabindex: Number.parseInt(element.getAttribute('tabindex') ?? '0', 10) || 0,
    }))
    .sort((a, b) => {
      const aPositive = a.tabindex > 0;
      const bPositive = b.tabindex > 0;
      if (aPositive && bPositive) return a.tabindex - b.tabindex || a.domIndex - b.domIndex;
      if (aPositive) return -1;
      if (bPositive) return 1;
      return a.domIndex - b.domIndex;
    })
    .map(({ element }) => element);
}

/** Every element that can take focus, including `tabindex="-1"` ones. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) =>
    isFocusable(element),
  );
}

/** Focuses the first tabbable element; returns the element that received focus. */
export function focusFirst(container: HTMLElement): HTMLElement | null {
  const [first] = getTabbableElements(container);
  first?.focus();
  return first ?? null;
}

/** Focuses the last tabbable element; returns the element that received focus. */
export function focusLast(container: HTMLElement): HTMLElement | null {
  const elements = getTabbableElements(container);
  const last = elements[elements.length - 1];
  last?.focus();
  return last ?? null;
}
