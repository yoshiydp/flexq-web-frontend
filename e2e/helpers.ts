import { expect, type Locator } from "@playwright/test";

/**
 * 要素が React にハイドレートされる（イベントハンドラが付く）まで待つ。
 *
 * page.goto は load イベントで戻るが、ハイドレーションはその後に走ることがある。
 * それより前にボタンを押すと onClick が無く、何も起きないままアサーションが失敗する
 * （FAQ の開閉・SP メニュー・カルーセルのドットなど、クライアントコンポーネントの操作で起きる）。
 * React はハイドレート済みの DOM ノードに `__reactProps$<id>` を生やすため、それを目印にする。
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(
      () =>
        locator
          .first()
          .evaluate((el) =>
            Object.keys(el).some((key) => key.startsWith("__reactProps$")),
          ),
      { message: "React のハイドレーションを待つ" },
    )
    .toBe(true);
}

/**
 * 要素を画面内にスクロールし、スクロール連動リビール（Reveal）の動きが終わるまで待つ。
 *
 * リビールは画面に入った瞬間に `translateY(28px)` → 0 へ 0.9 秒かけて動く。
 * その途中でクリックすると、Playwright が計算した座標と要素の位置がずれて空振りする
 * （高さ 28px の SP カルーセルのドットなどで起きる）。祖先の `.reveal-up` が
 * 止まった（opacity 1・transform なし）のを確かめてから操作する。
 */
export async function scrollIntoViewAndWaitForReveal(
  locator: Locator,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await expect
    .poll(
      () =>
        locator.evaluate((el) =>
          Array.from(document.querySelectorAll(".reveal-up"))
            .filter((reveal) => reveal.contains(el))
            .every((reveal) => {
              const style = getComputedStyle(reveal);
              return style.opacity === "1" && style.transform === "none";
            }),
        ),
      { message: "リビールのアニメーション終了を待つ" },
    )
    .toBe(true);
}
