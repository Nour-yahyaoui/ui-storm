import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Foundation-level accessibility gates.
 *
 * These run against the compiled Storybook, so a failing test means either the
 * design tokens or the direction layer is wrong — not that a test double is.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const FOUNDATION_STORIES = [
  { id: 'foundations-tokens--color', name: 'Color tokens' },
  { id: 'foundations-tokens--shape-and-motion', name: 'Shape and motion tokens' },
  { id: 'foundations-tokens--focus-indicator', name: 'Focus indicator' },
  { id: 'foundations-writing-direction--logical-properties', name: 'Logical properties' },
  { id: 'foundations-writing-direction--bidi-isolation', name: 'Bidi isolation' },
  { id: 'foundations-typography--script-pairing', name: 'Script pairing' },
];

function storyUrl(id: string, locale = 'en', theme = 'light'): string {
  return `/iframe.html?id=${id}&viewMode=story&globals=locale:${locale};theme:${theme}`;
}

async function openStory(page: Page, id: string, locale = 'en', theme = 'light') {
  await page.goto(storyUrl(id, locale, theme));
  await page.locator('#storybook-root').waitFor({ state: 'visible' });
  // Wait for webfonts/tokens to settle before measuring or scanning.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

for (const story of FOUNDATION_STORIES) {
  test(`${story.name} has no WCAG A/AA violations (LTR, light)`, async ({ page }) => {
    await openStory(page, story.id);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(
      results.violations,
      results.violations
        .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
        .join('\n'),
    ).toEqual([]);
  });

  test(`${story.name} has no WCAG A/AA violations (RTL, Arabic)`, async ({ page }) => {
    await openStory(page, story.id, 'ar-EG');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
      'RTL variant must pass the same rules as LTR',
    ).toEqual([]);
  });
}

test('locale global applies dir and lang to the story wrapper', async ({ page }) => {
  await openStory(page, 'foundations-writing-direction--logical-properties', 'ar-EG');

  const wrapper = page.locator('[data-aui-direction="rtl"]').first();
  await expect(wrapper).toHaveAttribute('dir', 'rtl');
  await expect(wrapper).toHaveAttribute('lang', 'ar-EG');
});

test('logical properties mirror the accent marker between LTR and RTL', async ({ page }) => {
  const readMarker = async (locale: string) => {
    await openStory(page, 'foundations-writing-direction--logical-properties', locale);

    const card = page.getByTestId('receipt-card');
    const marker = page.getByTestId('start-marker');
    const cardBox = await card.boundingBox();
    const markerBox = await marker.boundingBox();

    if (!cardBox || !markerBox) throw new Error('Receipt card or marker did not render');
    return { cardBox, markerBox };
  };

  const ltr = await readMarker('en');
  const rtl = await readMarker('ar-EG');

  // In LTR the bar hugs the left edge of the card...
  expect(Math.abs(ltr.markerBox.x - ltr.cardBox.x)).toBeLessThanOrEqual(1);
  // ...and in RTL it hugs the right edge.
  const ltrRightGap = ltr.cardBox.x + ltr.cardBox.width - (ltr.markerBox.x + ltr.markerBox.width);
  const rtlRightGap = rtl.cardBox.x + rtl.cardBox.width - (rtl.markerBox.x + rtl.markerBox.width);
  const rtlLeftGap = rtl.markerBox.x - rtl.cardBox.x;

  expect(ltrRightGap).toBeGreaterThan(100);
  expect(rtlRightGap).toBeLessThanOrEqual(1);
  expect(rtlLeftGap).toBeGreaterThan(100);
});

test('directional icon mirrors in RTL', async ({ page }) => {
  const arrowStyle = async (locale: string) => {
    await openStory(page, 'foundations-writing-direction--logical-properties', locale);
    await page.getByText('2,450.00 TND').first().waitFor();

    return page
      .locator('svg')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { rotate: style.rotate, transform: style.transform };
      });
  };

  const ltr = await arrowStyle('en');
  const rtl = await arrowStyle('ar-EG');

  // Tailwind v4 mirrors with the `rotate` property; older output used a matrix
  // transform. Accept either, but require that LTR is unrotated.
  expect(['none', '0deg']).toContain(ltr.rotate);
  expect(ltr.transform === 'none' || ltr.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);

  const mirrored = rtl.rotate === '180deg' || rtl.transform.includes('-1');
  expect(
    mirrored,
    `expected a 180deg rotation, got rotate=${rtl.rotate} transform=${rtl.transform}`,
  ).toBe(true);
});

test('RTL layout reflows at 320px without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });

  for (const id of [
    'foundations-writing-direction--logical-properties',
    'foundations-typography--script-pairing',
  ]) {
    await openStory(page, id, 'ar-EG');

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow, `Horizontal scroll at 320px on ${id}`).toBeLessThanOrEqual(1);
  }
});

test('dark theme keeps tokens below contrast requirements', async ({ page }) => {
  await openStory(page, 'foundations-tokens--color', 'en', 'dark');

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
