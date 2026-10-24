import { expect, test } from "@playwright/test";

import { waitForHydration } from "./helpers";

/**
 * SP メニュー（docs/test-cases.md「2. ナビゲーション / SP メニュー（NV）」の NV-03〜NV-05）。
 */

test.describe("NV SP メニュー", { tag: "@NV" }, () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "SP メニューは 768px 未満のみ表示");
    await page.goto("/");
    await waitForHydration(
      page.getByRole("button", { name: "メニューを開く" }),
    );
  });

  test("NV-03 ハンバーガーで開き、リンクタップで閉じる", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await expect(menu).toBeHidden();

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "FAQ" })).toBeVisible();

    await menu.getByRole("link", { name: "FAQ" }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("NV-04 × ボタンで閉じる", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu).toBeVisible();

    await page.getByRole("button", { name: "メニューを閉じる" }).click();
    await expect(menu).toBeHidden();
  });

  test("NV-05 メニュー下部にストアボタンが表示される", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu.getByRole("link", { name: /App Store/ })).toBeVisible();
    // Google Play は URL 設定後（Android 版の公開後）だけバッジが出る
    const googlePlay = menu.getByRole("link", { name: /Google Play/ });
    if ((await googlePlay.count()) > 0) await expect(googlePlay).toBeVisible();
  });
});
