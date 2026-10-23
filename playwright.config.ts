import { defineConfig, devices } from "@playwright/test";

/**
 * E2E テスト設定（flexq-mobile の Maestro に相当）。
 *
 * テスト名の先頭は docs/test-cases.md のケース ID（例: `TP-01 ...`）。
 * describe にはセクションのタグ（例: `@TP`）を付けているので、
 * `npx playwright test --grep @TP` でセクション単位、`--grep "TP-01 "` でケース単位に実行できる。
 *
 * webServer が本番ビルドを自動起動する（要: 事前の `yarn build`。
 * ローカルで dev サーバー（port 3000）を立てたまま流用したい場合は
 * PLAYWRIGHT_BASE_URL=http://localhost:3000 を指定する）。
 *
 * Strapi（localhost:1337）は起動していなくてもよい:
 * トップページはフォールバック文言で描画される設計のため、
 * CMS 依存のテストはデータがない場合 skip される。
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI は GitHub の注釈に加え、失敗時にアーティファクトとして保存する HTML レポートを出す
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // README 用の素材生成（features-linebreak.spec.ts の @record）は検証ではないため、
  // RECORD_VIDEO=1（yarn e2e:record）のときだけ対象にする
  grepInvert: process.env.RECORD_VIDEO ? undefined : /@record/,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // PC / SP の両方で全フローを実行（Maestro の iOS / Android 分岐に相当）
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"], browserName: "chromium" },
      // SEO（meta / robots.txt / sitemap.xml）は表示幅に依存しないため desktop でのみ実行する
      testIgnore: /seo\.spec\.ts$/,
    },
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
