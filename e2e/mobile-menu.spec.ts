import { expect, test } from "@playwright/test";

test.describe("SP メニュー", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "SP メニューは 768px 未満のみ表示");
    await page.goto("/");
  });

  test("ハンバーガーで開き、リンクタップで閉じる", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await expect(menu).toBeHidden();

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "FAQ" })).toBeVisible();

    await menu.getByRole("link", { name: "FAQ" }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("× ボタンで閉じる", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu).toBeVisible();

    await page.getByRole("button", { name: "メニューを閉じる" }).click();
    await expect(menu).toBeHidden();
  });

  test("メニュー下部にストアボタンが表示される", async ({ page }) => {
    const menu = page.getByTestId("mobile-menu");
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(menu.getByRole("link", { name: /App Store/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /Google Play/ })).toBeVisible();
  });
});
