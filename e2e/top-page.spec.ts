import { expect, test } from "@playwright/test";

test.describe("トップページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ヒーローにロゴとタグラインが表示される", async ({ page }) => {
    // タグライン文言は CMS で変更され得るため、内容ではなく構造で検証する
    const hero = page.locator("#hero");
    await expect(hero.getByRole("img", { name: "FlexQ" })).toBeVisible();
    const tagline = hero.locator("p");
    await expect(tagline).toBeVisible();
    await expect(tagline).not.toBeEmpty();
  });

  test("主要セクションが描画される", async ({ page }) => {
    for (const id of ["#features", "#preview", "#faq", "#download"]) {
      await expect(page.locator(id)).toBeAttached();
    }
  });

  test("FAQ が開閉できる", async ({ page }) => {
    // Q&A の文言は CMS で変更され得るため、内容ではなく details/summary の開閉挙動で検証する
    const firstFaq = page.locator("#faq details").first();
    const answer = firstFaq.locator("p");

    await firstFaq.scrollIntoViewIfNeeded();
    await expect(answer).toBeHidden();
    await firstFaq.locator("summary").click();
    await expect(answer).toBeVisible();
  });

  test("CTA にストアボタンが 2 つ表示される", async ({ page }) => {
    const cta = page.locator("#download");
    await cta.scrollIntoViewIfNeeded();
    await expect(cta.getByRole("link", { name: /App Store/ })).toBeVisible();
    await expect(cta.getByRole("link", { name: /Google Play/ })).toBeVisible();
  });

  test("SCROLL インジケーターで最初のコンテンツへスクロールする", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "コンテンツへスクロール" }).click();
    await expect(page).toHaveURL(/#statement$/);
    await expect(page.locator("#statement")).toBeInViewport();
  });

  test("PC ナビからセクションへ移動できる", async ({ page, isMobile }) => {
    test.skip(isMobile, "PC ナビは 768px 以上のみ表示");

    await page
      .getByRole("banner")
      .getByRole("link", { name: "FEATURES" })
      .click();
    await expect(page).toHaveURL(/#features$/);
    await expect(page.locator("#features")).toBeInViewport();
  });
});
