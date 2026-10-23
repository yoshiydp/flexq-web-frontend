import { expect, test, type Page } from "@playwright/test";

/**
 * 404 / エラー画面（docs/test-cases.md「5. 404 / エラー（ER）」）。
 *
 * 記事詳細は CMS 障害時に実在する記事まで 404 と誤判定しないよう、取得失敗をエラーとして扱う
 * （src/lib/strapi.ts の fetchCollectionOrThrow）。そのため存在しない記事の表示は Strapi の稼働状況で変わる:
 * - Strapi 稼働中 … 404 ページ（not-found.tsx・PAGE NOT FOUND）→ ER-02
 * - Strapi 停止中 … エラーページ（error.tsx・data-testid="error-page"）→ ER-03
 * どちらか一方は必ずスキップになる。ルートの loading.tsx によるストリーミング配信のため、
 * 記事詳細の HTTP ステータスは 200 になる（ステータスではなく画面で判定する）。
 */

const MISSING_ARTICLE = "/news/no-such-article";

/** 存在しない記事を開き、404 / エラーのどちらの画面になったかを返す */
async function openMissingArticle(page: Page): Promise<"not-found" | "error"> {
  await page.goto(MISSING_ARTICLE);
  const notFound = page.getByRole("heading", { name: "PAGE NOT FOUND" });
  const errorPage = page.getByTestId("error-page");
  await expect(notFound.or(errorPage).first()).toBeVisible();
  return (await errorPage.isVisible()) ? "error" : "not-found";
}

test.describe("ER 404 / エラー", { tag: "@ER" }, () => {
  test("ER-01 存在しない URL は 404 ページを表示する", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "PAGE NOT FOUND" }),
    ).toBeVisible();
    await expect(
      page.getByText("お探しのページは見つかりませんでした。"),
    ).toBeVisible();

    await page.getByRole("link", { name: "BACK TO TOP" }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("ER-02 存在しない記事は 404 ページを表示する（Strapi 稼働時）", async ({
    page,
  }) => {
    const shown = await openMissingArticle(page);
    test.skip(shown === "error", "CMS（Strapi）未起動のため ER-03 で検証する");
    await expect(
      page.getByText("お探しのページは見つかりませんでした。"),
    ).toBeVisible();
  });

  test("ER-03 Strapi 停止中の記事詳細は 404 ではなくエラーページを表示する", async ({
    page,
  }) => {
    const shown = await openMissingArticle(page);
    test.skip(
      shown === "not-found",
      "CMS（Strapi）稼働中のため ER-02 で検証する",
    );

    const errorPage = page.getByTestId("error-page");
    await expect(
      errorPage.getByRole("heading", { name: "PAGE COULD NOT BE LOADED" }),
    ).toBeVisible();
    await expect(
      errorPage.getByRole("button", { name: "再読み込み" }),
    ).toBeVisible();
    await errorPage.getByRole("link", { name: "BACK TO TOP" }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  });
});
