import { defineConfig, devices } from '@playwright/test';

const PORT = 6006;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium-ltr',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
    },
    {
      name: 'chromium-rtl-ar',
      use: { ...devices['Desktop Chrome'], locale: 'ar-EG' },
    },
  ],
  // Accessibility tests run against the compiled Storybook, so a green E2E run
  // also proves the published stories build without Tailwind/RTL regressions.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run build:storybook && npm run serve:storybook',
        url: `${BASE_URL}/iframe.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
