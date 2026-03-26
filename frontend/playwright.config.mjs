import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const backendDir = path.join(repoRoot, 'backend');
const frontendDir = path.join(repoRoot, 'frontend');
const globalSetup = process.env.PLAYWRIGHT_SKIP_GLOBAL_SETUP
  ? undefined
  : './e2e/global-setup.mjs';
const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER
  ? undefined
  : [
      {
        command: 'npm run start',
        cwd: backendDir,
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
      {
        command: 'npm start -- --host 127.0.0.1 --port 4200',
        cwd: frontendDir,
        url: 'http://127.0.0.1:4200',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    ];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  globalSetup,
  webServer,
});
