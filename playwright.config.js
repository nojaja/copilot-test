// playwright.config.js
// E2Eテスト用Playwright設定ファイル
// http://localhost:8080 でSPAをテスト

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './client/tests/e2e',
  timeout: 30 * 1000,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
