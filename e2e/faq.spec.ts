import { expect, test } from "@playwright/test";

import { scrollIntoViewAndWaitForReveal, waitForHydration } from "./helpers";

/**
 * トップページの FAQ（docs/test-cases.md「3. FAQ（FQ）」）。
 *
 * Q&A の文言は CMS で変更され得るため、内容ではなくアコーディオンの構造で検証する。
 * 各行は「質問の button（aria-expanded / aria-controls）+ 回答の region」で、
 * 閉じた回答は高さ 0（grid-template-rows: 0fr）かつ inert になる。
 */

test.describe("FQ FAQ", { tag: "@FQ" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await waitForHydration(page.locator("#faq button[aria-expanded]"));
  });

  test("FQ-01 質問をクリックすると回答が開閉する", async ({ page }) => {
    const question = page.locator("#faq button[aria-expanded]").first();
    const answer = page.locator(
      `[id="${await question.getAttribute("aria-controls")}"]`,
    );

    await expect(question).toHaveAttribute("aria-expanded", "false");
    await expect(answer).toBeHidden();
    await expect(answer).toHaveAttribute("inert", "");

    await scrollIntoViewAndWaitForReveal(question);
    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(answer).toBeVisible();
    await expect(answer).not.toHaveAttribute("inert");
    await expect(answer.locator("p").first()).not.toBeEmpty();

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await expect(answer).toBeHidden();
  });

  test("FQ-02 複数の質問を同時に開いておける", async ({ page }) => {
    const questions = page.locator("#faq button[aria-expanded]");
    // CMS の FAQ が 1 件だけの場合は、同時に開く対象がない
    test.skip((await questions.count()) < 2, "FAQ が 1 件以下");

    for (const index of [0, 1]) {
      await scrollIntoViewAndWaitForReveal(questions.nth(index));
      await questions.nth(index).click();
    }
    await expect(questions.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(questions.nth(1)).toHaveAttribute("aria-expanded", "true");
  });

  test("FQ-03 キーボード（Enter / Space）で開閉できる", async ({ page }) => {
    const question = page.locator("#faq button[aria-expanded]").first();
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(question).toHaveAttribute("aria-expanded", "false");
  });

  test("FQ-04 回答内のリンクからお問い合わせフォームへ移動できる", async ({
    page,
  }) => {
    const link = page.locator("#faq").getByRole("link", {
      name: /お問い合わせフォームへ/,
      includeHidden: true,
    });
    test.skip(
      (await link.count()) === 0,
      "CMS の FAQ にお問い合わせへのリンクが設定されていない",
    );

    // リンクを含む質問を開く（閉じている間は inert でクリックできない）
    const row = page.locator("#faq li").filter({
      has: page.getByRole("link", {
        name: /お問い合わせフォームへ/,
        includeHidden: true,
      }),
    });
    await scrollIntoViewAndWaitForReveal(row.getByRole("button"));
    await row.getByRole("button").click();
    await expect(link).toBeVisible();

    await link.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { name: "CONTACT" })).toBeVisible();
  });
});
