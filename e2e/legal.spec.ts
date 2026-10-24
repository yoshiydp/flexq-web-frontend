import { expect, test } from "@playwright/test";

/**
 * 規約・プライバシーポリシー（docs/test-cases.md「7. 規約 / プライバシー（LG）」）。
 * Google OAuth の同意画面から参照される公開 URL のため、表示崩れ・リンク切れを確認する。
 */

const DOCUMENTS = [
  {
    id: "LG-01",
    name: "利用規約",
    path: "/terms",
    heading: "TERMS OF SERVICE",
    first: "第1条（適用）",
    last: "第13条（お問い合わせ）",
    sections: 13,
  },
  {
    id: "LG-02",
    name: "プライバシーポリシー",
    path: "/privacy-policy",
    heading: "PRIVACY POLICY",
    first: "第1条（収集する情報）",
    last: "第11条（お問い合わせ）",
    sections: 11,
  },
] as const;

test.describe("LG 規約 / プライバシー", { tag: "@LG" }, () => {
  for (const doc of DOCUMENTS) {
    test(`${doc.id} ${doc.name}が全条項と連絡先付きで表示される`, async ({
      page,
    }) => {
      await page.goto(doc.path);
      await expect(
        page.getByRole("heading", { name: doc.heading, exact: true }),
      ).toBeVisible();

      const article = page.getByRole("article");
      await expect(article.getByRole("heading", { level: 2 })).toHaveCount(
        doc.sections,
      );
      await expect(
        article.getByRole("heading", { name: doc.first }),
      ).toBeVisible();
      await expect(
        article.getByRole("heading", { name: doc.last }),
      ).toBeAttached();
      await expect(
        article.getByRole("link", { name: "contact@flexqstudio.com" }),
      ).toHaveAttribute("href", "mailto:contact@flexqstudio.com");
      await expect(article.getByText("制定日: 2026年8月15日")).toBeAttached();
    });
  }

  test("LG-03 トップのフッターから規約・ポリシー・アカウント削除・お問い合わせへ移動できる", async ({
    page,
  }) => {
    for (const [label, path, heading] of [
      ["PRIVACY POLICY", "/privacy-policy", "PRIVACY POLICY"],
      ["TERMS", "/terms", "TERMS OF SERVICE"],
      ["ACCOUNT DELETION", "/account-deletion", "ACCOUNT DELETION"],
      ["CONTACT", "/contact", "CONTACT"],
    ]) {
      await page.goto("/");
      const link = page
        .getByRole("contentinfo")
        .getByRole("link", { name: label, exact: true });
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
  });

  test("LG-06 アカウント削除のご案内に削除手順・依頼方法・削除されるデータが表示される", async ({
    page,
  }) => {
    await page.goto("/account-deletion");
    await expect(
      page.getByRole("heading", { name: "ACCOUNT DELETION", exact: true }),
    ).toBeVisible();

    const article = page.getByRole("article");
    await expect(article.getByRole("heading", { level: 2 })).toHaveCount(5);
    await expect(
      article.getByText("「DELETE ACCOUNT」をタップする", { exact: false }),
    ).toBeVisible();
    await expect(
      article.getByText("「アカウント・データについて」を選ぶ", {
        exact: false,
      }),
    ).toBeAttached();
    await expect(
      article.getByRole("heading", { name: "3. 削除されるデータ" }),
    ).toBeAttached();
    await expect(article.getByText("掲載日: 2026年10月24日")).toBeAttached();

    // アプリを使わずに依頼する導線（Google Play が求める Web からの削除依頼）
    const form = article.getByRole("link", { name: "お問い合わせフォームへ" });
    await form.scrollIntoViewIfNeeded();
    await form.click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("LG-04 「トップへ戻る」でトップページへ戻る", async ({ page }) => {
    await page.goto("/terms");
    const back = page.getByRole("link", { name: "← トップへ戻る" });
    await back.scrollIntoViewIfNeeded();
    await back.click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
    await expect(page.locator("#hero")).toBeVisible();
  });
});
