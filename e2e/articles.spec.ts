import { expect, test } from "@playwright/test";

/**
 * 記事ページ（docs/test-cases.md「4. 記事一覧・詳細（AR）」）。
 * CMS（Strapi）にデータがある場合は一覧 → 詳細 → 一覧へ戻るまで検証し、
 * 空の場合（Strapi 未起動を含む）は空状態メッセージを検証する（どちらでも成立する設計）。
 * Strapi 稼働時の記事の中身（AR-04 / AR-05）は手動確認。
 */

test.describe("AR 記事一覧・詳細", { tag: "@AR" }, () => {
  test("AR-01 /news 一覧 → 詳細 → 一覧へ戻る", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "NEWS" })).toBeVisible();

    const cards = page.locator('main a[href^="/news/"]');
    if ((await cards.count()) === 0) {
      await expect(page.getByText("まだお知らせはありません。")).toBeVisible();
      return;
    }

    await cards.first().click();
    await expect(page).toHaveURL(/\/news\/.+/);
    await expect(page.getByRole("article")).toBeVisible();

    await page.getByRole("link", { name: /NEWS 一覧へ/ }).click();
    await expect(page).toHaveURL(/\/news$/);
  });

  test("AR-02 /tutorials 一覧が難易度バッジ付きで表示される", async ({
    page,
  }) => {
    await page.goto("/tutorials");
    await expect(page.getByRole("heading", { name: "TUTORIAL" })).toBeVisible();

    const rows = page.locator('main a[href^="/tutorials/"]');
    if ((await rows.count()) === 0) {
      await expect(
        page.getByText("まだチュートリアルはありません。"),
      ).toBeVisible();
      return;
    }
    await expect(rows.first()).toBeVisible();
    // difficulty は任意項目のため、バッジは設定されている記事がある場合のみ検証する
    const badges = page.getByText(/BEGINNER|INTERMEDIATE|ADVANCED/);
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("AR-03 /columns 一覧 → 詳細が表示される", async ({ page }) => {
    await page.goto("/columns");
    await expect(page.getByRole("heading", { name: "COLUMN" })).toBeVisible();

    const rows = page.locator('main a[href^="/columns/"]');
    if ((await rows.count()) === 0) {
      await expect(page.getByText("まだコラムはありません。")).toBeVisible();
      return;
    }

    await rows.first().click();
    await expect(page).toHaveURL(/\/columns\/.+/);
    await expect(page.getByRole("article")).toBeVisible();
  });
});
