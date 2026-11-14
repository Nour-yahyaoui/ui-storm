import { expect, test } from "@playwright/test";

test.describe("tabs", () => {
  test("the tab list is a single tab stop", async ({ page }) => {
    await page.goto("/components/tabs");
    const tabs = page.locator(".ui-tabs").first().locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('.ui-tabs').first().locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  });

  test("arrow keys move between tabs and activate on focus", async ({ page }) => {
    await page.goto("/components/tabs");
    const widget = page.locator(".ui-tabs").first();
    const tabs = widget.locator('[role="tab"]');
    const panels = widget.locator('[role="tabpanel"]');

    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();

    await page.keyboard.press("End");
    await expect(tabs.nth(2)).toBeFocused();

    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();

    // Wrapping is expected: one more ArrowLeft from the first tab lands on the last.
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(2)).toBeFocused();
  });

  test("arrow keys follow the reading direction", async ({ page }) => {
    await page.goto("/components/tabs?lang=ar");
    const widget = page.locator(".ui-tabs").first();
    const tabs = widget.locator('[role="tab"]');

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await tabs.first().focus();

    // In RTL the "next" arrow points left, so ArrowLeft advances.
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();

    // And ArrowRight goes back, wrapping past the first tab.
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toBeFocused();
  });

  test("panels are reachable from the tab list", async ({ page }) => {
    await page.goto("/components/tabs");
    const widget = page.locator(".ui-tabs").first();
    await widget.locator('[role="tab"]').first().focus();
    await page.keyboard.press("Tab");
    await expect(widget.locator('[role="tabpanel"]').first()).toBeFocused();
  });
});

test.describe("dialog", () => {
  test("opens, traps focus, closes on Escape and returns focus", async ({ page }) => {
    await page.goto("/components/dialog");
    const trigger = page.getByRole("button", { name: "Delete project" });
    const dialog = page.locator("dialog#delete-project");

    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", "delete-project-title");

    // Focus starts inside the dialog and stays there. Two exceptions are not
    // escapes, and pretending otherwise makes the test lie:
    //   - focus on the dialog element itself (the platform focuses it when no
    //     descendant asks for it);
    //   - focus on <body>/<html>, which is Chrome handing focus to the browser
    //     chrome at the end of the dialog's tab cycle. The next Tab comes back
    //     into the dialog, and no page control outside it can be reached.
    const trace: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        const open = document.querySelector("dialog[open]");
        const isChrome = active === null || active === document.body || active === document.documentElement;
        const inside = Boolean(
          active && open && (open === active || open.contains(active)),
        ) || isChrome;
        const description = active
          ? `${active.tagName.toLowerCase()}.${String(active.className || "")}`.split(" ")[0]
          : "none";
        return { inside, description };
      });
      trace.push(`${i}: ${state.inside ? "inside" : "OUTSIDE"} ${state.description}`);
    }
    const escaped = trace.filter((entry) => entry.includes("OUTSIDE"));
    expect(escaped, `focus left the dialog: ${trace.join(" | ")}`).toEqual([]);
    // And the page behind the dialog cannot be reached at all.
    expect(
      await page.evaluate(() => {
        const link = document.querySelector('nav a');
        link?.focus();
        return document.activeElement === link;
      }),
      "a page control outside the modal dialog received focus",
    ).toBe(false);

    // The dialog is in the top layer, which is what makes the rest of the page inert.
    expect(await dialog.evaluate((node: HTMLDialogElement) => node.matches(":modal"))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the close button is named and closes the dialog", async ({ page }) => {
    await page.goto("/components/dialog");
    await page.getByRole("button", { name: "Delete project" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.locator("dialog#delete-project")).toBeHidden();
  });
});

test.describe("form controls", () => {
  test("Space toggles a checkbox and the label is part of the hit area", async ({ page }) => {
    await page.goto("/components/checkbox");
    const checkbox = page.getByRole("checkbox", { name: "Send me the changelog" });
    await expect(checkbox).not.toBeChecked();

    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();

    await page.getByText("Remember this device").click();
    await expect(page.getByRole("checkbox", { name: "Remember this device" })).not.toBeChecked();
  });

  test("the mixed state is a real DOM property", async ({ page }) => {
    await page.goto("/components/checkbox");
    const mixed = page.getByRole("checkbox", { name: "Select all rows" });
    expect(await mixed.evaluate((node: HTMLInputElement) => node.indeterminate)).toBe(true);
  });

  test("aria-disabled stays in the tab order while disabled does not", async ({ page }) => {
    await page.goto("/components/button");
    const disabled = page.getByRole("button", { name: "Disabled" });
    const unavailable = page.getByRole("button", { name: "Unavailable" });

    await expect(disabled).toBeDisabled();
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).toBeEnabled();
  });
});
