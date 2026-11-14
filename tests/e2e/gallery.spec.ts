import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Every page, in both themes, in both directions. A serious or critical axe
 * violation fails the build; so does a page that quietly loses its direction.
 */
const PAGES = [
  "/",
  "/foundations",
  "/accessibility",
  "/rtl",
  "/components/button",
  "/components/icon-button",
  "/components/text-input",
  "/components/checkbox",
  "/components/dialog",
  "/components/tabs",
];

const VARIANTS = [
  { query: "", dir: "ltr", theme: "light" },
  { query: "?theme=dark", dir: "ltr", theme: "dark" },
  { query: "?lang=ar", dir: "rtl", theme: "light" },
];

for (const path of PAGES) {
  for (const variant of VARIANTS) {
    test(`${path}${variant.query || " (default)"} has no serious axe violations`, async ({
      page,
    }) => {
      await page.goto(path + variant.query);

      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-theme", variant.theme);
      // The RTL page is Arabic whatever the query says.
      await expect(html).toHaveAttribute("dir", path === "/rtl" ? "rtl" : variant.dir);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );

      expect(
        blocking.map(
          (violation) =>
            `${violation.id}: ${violation.help} -> ${violation.nodes
              .map((node) => node.target.join(" "))
              .join(", ")}`,
        ),
      ).toEqual([]);
    });
  }
}

test("the skip link moves focus into the main region", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.locator(".ui-skip-link");
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

test("each page has exactly one h1 and one current navigation link", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
  }
});

test("the layout reflows to 320px without horizontal scrolling", async ({ page }) => {
  for (const path of ["/", "/components/tabs", "/rtl"]) {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflows, `${path} overflows horizontally at 320px`).toBeLessThanOrEqual(1);
  }
});

test("directional glyphs mirror in right-to-left layouts and others do not", async ({
  page,
}) => {
  await page.goto("/components/icon-button");
  const directional = page.locator(".ui-icon--directional").first();
  await expect(directional).toHaveCount(1);
  expect(await directional.evaluate((node) => getComputedStyle(node).scale)).toBe("none");

  await page.goto("/components/icon-button?lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const mirrored = await page
    .locator(".ui-icon--directional")
    .first()
    .evaluate((node) => getComputedStyle(node).scale);
  expect(mirrored).not.toBe("none");

  // A magnifier must stay a magnifier.
  const searchGlyph = page.locator(".ui-icon-button__glyph").first();
  expect(await searchGlyph.evaluate((node) => getComputedStyle(node).scale)).toBe("none");
});

test("server-rendered markup is present without running scripts", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/components/tabs");

  // Every panel is readable when scripting is off; nothing is trapped behind JS.
  // The tabs page demonstrates two widgets: three horizontal and three vertical panels.
  await expect(page.locator('[role="tabpanel"]')).toHaveCount(6);
  for (const panel of await page.locator('[role="tabpanel"]').all()) {
    await expect(panel).toBeVisible();
  }
  await context.close();
});
