import { defineConfig, devices } from "@playwright/test";

/**
 * E2E テスト設定（flexq-mobile の Maestro に相当）。
 *
 * webServer が本番ビルドを自動起動する（要: 事前の `yarn build`。
 * ローカルで dev サーバー（port 3000）を立てたまま流用したい場合は
 * PLAYWRIGHT_BASE_URL=http://localhost:3000 を指定する）。
 *
 * Strapi（localhost:1337）は起動していなくてもよい:
 * トップページはフォールバック文言で描画される設計のため、
 * CMS 依存のテストはデータがない場合 skip される。
 */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // PC / SP の両方で全フローを実行（Maestro の iOS / Android 分岐に相当）
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"], browserName: "chromium" } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "yarn start --port 3200",
        url: "http://localhost:3200",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
