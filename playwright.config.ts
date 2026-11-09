import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, forbidOnly: true, retries: 0, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:43173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npm run start', url: 'http://127.0.0.1:43173', reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run preview --workspace=@lawprep/learner', url: 'http://127.0.0.1:43174', reuseExistingServer: false, timeout: 60_000 }
  ]
});
