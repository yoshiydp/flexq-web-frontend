import { expect, test } from "@playwright/test";

import { waitForHydration } from "./helpers";

/**
 * ヘッダーのナビゲーション（docs/test-cases.md「2. ナビゲーション / SP メニュー（NV）」）。
 * SP メニュー（NV-03〜NV-05）は mobile-menu.spec.ts、NV-08 は手動確認。
 */

test.describe("NV ナビゲーション", { tag: "@NV" }, () => {
  test("NV-01 PC ナビからセクションへ移動できる", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "PC ナビは 768px 以上のみ表示");
    await page.goto("/");

    await page
      .getByRole("banner")
      .getByRole("link", { name: "FEATURES" })
      .click();
    await expect(page).toHaveURL(/#features$/);
    await expect(page.locator("#features")).toBeInViewport();
  });

  test("NV-02 ヘッダーの DOWNLOAD でダウンロード CTA へ移動する", async ({
    page,
  }) => {
    await page.goto("/");

    // PC はナビ内のピル、SP はハンバーガー横のピル（表示中の方だけが取れる）
    await page
      .getByRole("banner")
      .getByRole("link", { name: "DOWNLOAD", exact: true })
      .click();
    await expect(page).toHaveURL(/#download$/);
    await expect(page.locator("#download")).toBeInViewport();
  });

  test("NV-06 サブページのナビからトップのセクションへ移動できる", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/terms");

    if (isMobile) {
      const hamburger = page.getByRole("button", { name: "メニューを開く" });
      await waitForHydration(hamburger);
      await hamburger.click();
      await page
        .getByTestId("mobile-menu")
        .getByRole("link", { name: "FAQ" })
        .click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: "FAQ" }).click();
    }

    await expect(page).toHaveURL(/\/#faq$/);
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("NV-07 サブページのヘッダーロゴからトップへ戻る", async ({ page }) => {
    await page.goto("/privacy-policy");

    // トップの SP ではロゴを出さないが、サブページでは PC / SP とも表示する
    const logo = page.getByRole("banner").getByRole("link", { name: "FlexQ" });
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
    await expect(page.locator("#hero")).toBeVisible();
  });
});
