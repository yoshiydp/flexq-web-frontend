import { expect, test } from "@playwright/test";

import { scrollIntoViewAndWaitForReveal, waitForHydration } from "./helpers";

/**
 * トップページ（docs/test-cases.md「1. トップページ（TP）」）。
 * TP-04 は features-linebreak.spec.ts、TP-06 は手動確認。
 */

test.describe("TP トップページ", { tag: "@TP" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("TP-01 ヒーローにロゴとタグラインが表示される", async ({ page }) => {
    // タグライン文言は CMS で変更され得るため、内容ではなく構造で検証する
    const hero = page.locator("#hero");
    await expect(hero.getByRole("img", { name: "FlexQ" })).toBeVisible();
    const tagline = hero.locator("p");
    await expect(tagline).toBeVisible();
    await expect(tagline).not.toBeEmpty();
  });

  test("TP-02 主要セクションが描画される", async ({ page }) => {
    for (const id of [
      "#hero",
      "#statement",
      "#features",
      "#preview",
      "#faq",
      "#download",
    ]) {
      await expect(page.locator(id)).toBeAttached();
    }
    // 3 CORE FEATURES のカード（既定は 3 枚。CMS で件数が変わり得るため 1 枚以上で判定する）
    await expect(page.locator("#features article").first()).toBeVisible();
  });

  test("TP-03 SCROLL インジケーターで最初のコンテンツへスクロールする", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "コンテンツへスクロール" }).click();
    await expect(page).toHaveURL(/#statement$/);
    await expect(page.locator("#statement")).toBeInViewport();
  });

  test("TP-05 APP PREVIEW（SP）はドットで画面を切り替えられる", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "SP の横スクロールカルーセルは 768px 未満のみ表示");

    const preview = page.locator("#preview");
    await preview.scrollIntoViewIfNeeded();
    // 画面の数・キャプションは CMS で変わり得るため、並び順（構造）で検証する。
    // PC カルーセル（md 以上・非表示）も figcaption を持つため、表示中のものに絞る
    const captions = preview.locator("figcaption").filter({ visible: true });
    const dots = preview.getByRole("button");
    test.skip((await dots.count()) < 2, "APP PREVIEW の画面が 1 つ以下");

    // 初期状態は先頭の画面がアクティブ（ゴールド）
    await expect(captions.nth(0)).toHaveClass(/text-primary/);

    const dot = dots.nth(1);
    await waitForHydration(dot);
    await scrollIntoViewAndWaitForReveal(dot);
    await dot.click();
    await expect(captions.nth(1)).toHaveClass(/text-primary/);
    await expect(captions.nth(0)).not.toHaveClass(/text-primary/);
  });

  test("TP-07 CTA にストアボタンが表示される", async ({ page }) => {
    const cta = page.locator("#download");
    await cta.scrollIntoViewIfNeeded();
    // Google Play は URL 設定後（Android 版の公開後）だけバッジが出る
    const googlePlay = cta.getByRole("link", { name: /Google Play/ });
    const badges = [
      cta.getByRole("link", { name: /App Store/ }),
      ...((await googlePlay.count()) > 0 ? [googlePlay] : []),
    ];
    for (const badge of badges) {
      await expect(badge).toBeVisible();
      // ストア URL が未設定の間は CTA へのアンカー、設定後は新しいタブでストアを開く
      const href = await badge.getAttribute("href");
      if (href === "/#download") continue;
      expect(href).toMatch(/^https:\/\//);
      await expect(badge).toHaveAttribute("target", "_blank");
    }
  });

  test("TP-08 NEWS / LEARN はセクションの有無とナビの表示が一致する", async ({
    page,
    isMobile,
  }) => {
    // CMS 未接続（本番の現状）ではセクションごと非表示になり、ナビからも消える。
    // Strapi 稼働中でも成立するよう、セクションの有無とナビの有無が一致することを検証する
    const footerNav = page.getByRole("contentinfo");
    for (const { id, label } of [
      { id: "news", label: "NEWS" },
      { id: "learn", label: "LEARN" },
    ]) {
      const hasSection = (await page.locator(`#${id}`).count()) > 0;
      const expected = hasSection ? 1 : 0;
      await expect(
        footerNav.getByRole("link", { name: label, exact: true }),
      ).toHaveCount(expected);
      if (!isMobile) {
        await expect(
          page
            .getByRole("banner")
            .getByRole("link", { name: label, exact: true }),
        ).toHaveCount(expected);
      }
    }
    // 常に表示されるリンク
    for (const label of ["FEATURES", "PREVIEW", "FAQ"]) {
      await expect(
        footerNav.getByRole("link", { name: label, exact: true }),
      ).toBeVisible();
    }
  });

  test("TP-09 フッターに規約リンク・商標表記・コピーライトが表示される", async ({
    page,
  }) => {
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    for (const [label, href] of [
      ["PRIVACY POLICY", "/privacy-policy"],
      ["TERMS", "/terms"],
      ["ACCOUNT DELETION", "/account-deletion"],
      ["CONTACT", "/contact"],
    ]) {
      await expect(
        footer.getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("href", href);
    }
    await expect(footer.getByText(/App Store は.*Apple Inc\./)).toBeVisible();
    await expect(footer.getByText(/Google Play .*Google LLC/)).toBeVisible();
    await expect(
      footer.getByText(`© ${new Date().getFullYear()} FlexQ`),
    ).toBeVisible();
  });
});
