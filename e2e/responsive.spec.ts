import { expect, test } from "@playwright/test";

/**
 * レスポンシブ（docs/test-cases.md「9. レスポンシブ（RS）」）。
 * desktop（Desktop Chrome）/ mobile（iPhone 14 ビューポート）の両プロジェクトで実行する。
 * 実機ブラウザ・境界幅の確認（RS-03 / RS-04）は手動。
 */

const PAGES = ["/", "/news", "/terms", "/privacy-policy", "/contact"];

test.describe("RS レスポンシブ", { tag: "@RS" }, () => {
  test("RS-01 表示幅に応じてヘッダーが PC ナビ / ハンバーガーに切り替わる", async ({
    page,
    isMobile,
  }) => {
    const banner = page.getByRole("banner");
    const hamburger = page.getByRole("button", { name: "メニューを開く" });
    const pcNavLink = banner.getByRole("link", { name: "FEATURES" });
    const logo = banner.getByRole("link", { name: "FlexQ" });

    await page.goto("/");
    if (isMobile) {
      await expect(hamburger).toBeVisible();
      await expect(pcNavLink).toBeHidden();
      // SP のトップはヒーローの大ロゴと重複するため、ヘッダーのロゴを出さない
      await expect(logo).toBeHidden();
    } else {
      await expect(hamburger).toBeHidden();
      await expect(pcNavLink).toBeVisible();
      await expect(logo).toBeVisible();
    }

    // サブページでは PC / SP ともヘッダーのロゴを出す
    await page.goto("/terms");
    await expect(logo).toBeVisible();
  });

  test("RS-02 主要ページで横スクロールが発生しない", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      // 遅れて描画される要素（WebGL キャンバス・動画）を待つ
      await page.waitForLoadState("load");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${path} の横はみ出し（px）`).toBeLessThanOrEqual(0);
    }
  });
});
