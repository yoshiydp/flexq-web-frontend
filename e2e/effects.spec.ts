import { expect, test, type Locator } from "@playwright/test";

/**
 * 演出（docs/test-cases.md「10. 演出（FX）」）のうち、仕組みとして自動で確認できるもの。
 * 見た目・動きの質（慣性の感触・段差・シェーダーの描画内容など）は手動確認。
 */

/** 画面外にある FAQ 見出し（リビール対象）の不透明度 */
const opacityOf = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).opacity);

test.describe("FX 演出", { tag: "@FX" }, () => {
  test("FX-02 画面外の要素はスクロールで画面に入るとリビールされる", async ({
    page,
  }) => {
    await page.goto("/");
    const target = page.locator("#faq .reveal-up").first();

    // 初期表示ではまだ画面外のため非表示（opacity 0）
    expect(await opacityOf(target)).toBe("0");

    await target.scrollIntoViewIfNeeded();
    await expect.poll(() => opacityOf(target)).toBe("1");
  });

  test.describe("prefers-reduced-motion: reduce", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("FX-04 動きを減らす設定ではリビールせず最初から表示する", async ({
      page,
    }) => {
      await page.goto("/");
      // スクロールしていない画面外の要素も表示状態になっている
      expect(await opacityOf(page.locator("#faq .reveal-up").first())).toBe(
        "1",
      );
    });
  });

  test.describe("JavaScript 無効", () => {
    test.use({ javaScriptEnabled: false });

    test("FX-05 JavaScript が無効でもコンテンツが表示される", async ({
      page,
    }) => {
      await page.goto("/");
      // layout.tsx の <noscript> スタイルでリビールの非表示状態が解除される
      expect(
        await opacityOf(page.locator("#statement .reveal-up").first()),
      ).toBe("1");
      await expect(page.locator("#faq")).toContainText("FAQ");
    });
  });

  test("FX-06 キービジュアルの WebGL キャンバスが描画される", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    const canvas = page.locator("#hero canvas");
    await expect(canvas).toBeVisible();
    // R3F はマウント直後は既定サイズ（300x150）で、親要素を測ってから全面に広げる。
    // 縦スクロールバーの幅（環境で 0〜17px）ぶんは許容する
    const viewportWidth = page.viewportSize()?.width ?? 0;
    await expect
      .poll(async () => (await canvas.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(viewportWidth - 20);
    expect(errors).toEqual([]);
  });
});
