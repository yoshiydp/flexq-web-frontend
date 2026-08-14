import { expect, test } from "@playwright/test";

/**
 * 記事ページのフロー。
 * CMS（Strapi）にデータがある場合は一覧 → 詳細 → 一覧へ戻るまで検証し、
 * 空の場合は空状態メッセージを検証する（どちらでも成立する設計）。
 */

test.describe("記事一覧・詳細", () => {
  test("/news 一覧 → 詳細 → 一覧へ戻る", async ({ page }) => {
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

  test("/tutorials 一覧が難易度バッジ付きで表示される", async ({ page }) => {
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

  test("/columns 一覧 → 詳細が表示される", async ({ page }) => {
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

  test("存在しない記事は 404 を返す", async ({ page }) => {
    const response = await page.goto("/news/no-such-article");
    const status = response?.status();
    // CMS 未起動時は「実在記事を 404 と誤判定しない」設計により 500 になるため、
    // このテストは CMS 到達可能な場合のみ検証する
    test.skip(status === 500, "CMS（Strapi）未起動のためスキップ");
    expect(status).toBe(404);
  });
});
