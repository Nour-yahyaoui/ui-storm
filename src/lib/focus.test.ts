import { beforeEach, describe, expect, it } from 'vitest';
import {
  focusFirst,
  focusLast,
  getFocusableElements,
  getTabbableElements,
  isFocusable,
} from './focus';

function mount(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('isFocusable', () => {
  it('accepts native interactive elements', () => {
    const container = mount('<button>Go</button><a href="#x">Link</a><input /><select></select>');
    expect(getFocusableElements(container)).toHaveLength(4);
  });

  it('rejects disabled, hidden and aria-hidden elements', () => {
    const container = mount(`
      <button disabled>disabled</button>
      <button hidden>hidden</button>
      <button aria-hidden="true">aria-hidden</button>
      <input type="hidden" />
      <button>ok</button>
    `);
    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toHaveTextContent('ok');
  });

  it('rejects elements inside an inert subtree', () => {
    const container = mount('<div inert><button>inside</button></div><button>outside</button>');
    const focusable = getFocusableElements(container);

    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toHaveTextContent('outside');
  });

  it('rejects explicitly disabled custom elements via aria-disabled', () => {
    const container = mount('<div role="button" tabindex="0" aria-disabled="true">x</div>');
    expect(isFocusable(container.firstElementChild)).toBe(false);
  });

  it('accepts programmatically focusable elements (tabindex="-1")', () => {
    const container = mount('<div tabindex="-1">panel</div>');
    expect(isFocusable(container.firstElementChild)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isFocusable(null)).toBe(false);
  });
});

describe('getTabbableElements', () => {
  it('orders positive tabindex first, then DOM order', () => {
    const container = mount(`
      <button id="first">first</button>
      <button id="third" tabindex="2">third</button>
      <button id="second" tabindex="1">second</button>
      <button id="skipped" tabindex="-1">skipped</button>
    `);

    expect(getTabbableElements(container).map((element) => element.id)).toEqual([
      'second',
      'third',
      'first',
    ]);
  });

  it('keeps DOM order when tabindex values tie', () => {
    const container = mount(`
      <button id="a" tabindex="1">a</button>
      <button id="b" tabindex="1">b</button>
    `);

    expect(getTabbableElements(container).map((element) => element.id)).toEqual(['a', 'b']);
  });
});

describe('focusFirst / focusLast', () => {
  it('moves focus to the edges of the container', () => {
    const container = mount('<button id="start">start</button><button id="end">end</button>');

    expect(focusFirst(container)?.id).toBe('start');
    expect(document.activeElement?.id).toBe('start');

    expect(focusLast(container)?.id).toBe('end');
    expect(document.activeElement?.id).toBe('end');
  });

  it('returns null when there is nothing to focus', () => {
    const container = mount('<p>text</p>');
    expect(focusFirst(container)).toBeNull();
    expect(focusLast(container)).toBeNull();
  });
});
