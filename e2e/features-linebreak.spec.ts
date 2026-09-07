import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * 3 CORE FEATURES の見出しの改行位置を検証しつつ、
 * ウィンドウ幅をリアルタイムに可変させたスクリーンレコードを生成するフロー。
 *
 * 実行:
 *   yarn e2e:record
 *   （事前に開発サーバー（yarn dev）または本番サーバーを起動しておく）
 *
 * 通常の `yarn e2e` では RECORD_VIDEO 未設定のため skip される（録画に時間がかかるため）。
 * 出力: test-results/video/features-linebreak.webm
 */

const OUT_DIR = path.join(process.cwd(), "test-results", "video");
const VIDEO_SIZE = { width: 1280, height: 1000 };
const MIN_WIDTH = 320;
const STEP = 16;
/** 静止して改行位置を検証する幅 */
const CHECKPOINTS = [1024, 768, 375, 320];

/** 見出しの実際の改行位置を、1 文字ずつの矩形位置から行単位で復元する。 */
async function readHeadingLines(page: Page): Promise<string[][]> {
  return page.$$eval("#features h4", (els) =>
    els.map((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) nodes.push(node as Text);

      const lines: string[] = [];
      let current = "";
      let lastTop: number | null = null;
      for (const textNode of nodes) {
        const text = textNode.textContent ?? "";
        for (let i = 0; i < text.length; i++) {
          const range = document.createRange();
          range.setStart(textNode, i);
          range.setEnd(textNode, i + 1);
          const top = Math.round(range.getBoundingClientRect().top);
          if (lastTop !== null && top !== lastTop) {
            lines.push(current);
            current = "";
          }
          lastTop = top;
          current += text[i];
        }
      }
      lines.push(current);
      return lines;
    }),
  );
}

/** 1280px → 320px の幅の並び（チェックポイントを必ず通る）。 */
function descendingWidths(): number[] {
  const steps = new Set<number>();
  for (let w = VIDEO_SIZE.width; w >= MIN_WIDTH; w -= STEP) steps.add(w);
  steps.add(MIN_WIDTH);
  for (const checkpoint of CHECKPOINTS) steps.add(checkpoint);
  return [...steps].sort((a, b) => b - a);
}

test("3 CORE FEATURES の見出しが lg 未満では読点で改行される（録画付き）", async ({
  browser,
}) => {
  test.skip(
    test.info().project.name !== "desktop",
    "録画フローは desktop プロジェクトでのみ実行する",
  );
  test.skip(
    !process.env.RECORD_VIDEO,
    "録画フローは RECORD_VIDEO=1 のときのみ実行する",
  );
  test.setTimeout(180_000);

  mkdirSync(OUT_DIR, { recursive: true });

  const context = await browser.newContext({
    viewport: { ...VIDEO_SIZE },
    recordVideo: { dir: OUT_DIR, size: VIDEO_SIZE },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto("/");
  // Next.js の開発オーバーレイは録画に映り込むため隠す
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  });

  await expect(page.locator("#features h4").first()).toBeVisible();
  await page.waitForLoadState("networkidle");

  // 3 CORE FEATURES 以外は録画から外す。
  // 自動再生の動画や WebGL キャンバスが動き続けていると screencast のフレームが落ち、
  // 幅を変えても録画が固まったままになるため、停止したうえで非表示にする。
  // （React に書き換えられないよう、DOM は属性のみ付与して CSS 側で消す）
  await page.addStyleTag({
    content:
      "[data-e2e-hidden] { display: none !important; } canvas { display: none !important; }",
  });
  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((video) => {
      video.pause();
      video.removeAttribute("autoplay");
    });
    let node: Element | null = document.querySelector("#features");
    while (node && node !== document.body) {
      const parent = node.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node) sibling.setAttribute("data-e2e-hidden", "");
      }
      node = parent;
    }
  });

  // 録画に現在の幅を表示するバッジ（position: fixed なのでレイアウトには影響しない）
  await page.evaluate(() => {
    const badge = document.createElement("div");
    badge.id = "e2e-width-badge";
    badge.style.cssText = [
      "position:fixed",
      "top:16px",
      "left:16px",
      "z-index:2147483647",
      "padding:8px 14px",
      "border-radius:8px",
      "background:rgba(0,0,0,.72)",
      "border:1px solid rgba(255,215,0,.5)",
      "color:#ffd700",
      "font:600 16px/1 ui-monospace,SFMono-Regular,Menlo,monospace",
      "letter-spacing:.08em",
      "pointer-events:none",
    ].join(";");
    const update = () => {
      badge.textContent = `${window.innerWidth}px`;
    };
    update();
    window.addEventListener("resize", update);
    document.body.appendChild(badge);
  });

  /** 幅を変え、見出しが画面内に収まる位置までスクロールし直す。 */
  const resize = async (width: number, settleMs: number) => {
    await page.setViewportSize({ width, height: VIDEO_SIZE.height });
    await page.evaluate(() => {
      const el = document.querySelector("#features h4");
      const top = (el?.getBoundingClientRect().top ?? 0) + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 140), behavior: "instant" });
    });
    await page.waitForTimeout(settleMs);
  };

  const widths = descendingWidths();
  const verified: Record<number, string[][]> = {};

  // 1280px → 320px へなめらかに狭め、要所で静止して改行位置を計測する
  for (const width of widths) {
    await resize(width, 80);
    if (CHECKPOINTS.includes(width)) {
      await page.waitForTimeout(900);
      verified[width] = await readHeadingLines(page);
    }
  }

  await page.waitForTimeout(700);

  // 320px → 1280px へ戻す
  for (const width of [...widths].reverse()) {
    await resize(width, 55);
  }
  await page.waitForTimeout(900);

  await context.close();

  const source = await page.video()?.path();
  if (source) {
    renameSync(source, path.join(OUT_DIR, "features-linebreak.webm"));
  }

  // lg 未満（1023px 以下）は読点の直後で改行される
  for (const width of [768, 375, 320]) {
    expect(verified[width], `${width}px の計測結果`).toEqual([
      ["作りたい場所へ、", "ワンタップ。"],
      ["思いついた瞬間、", "そのまま録る。"],
      ["聴きながら、", "そのまま書く。"],
    ]);
  }

  // lg 以上は従来どおり text-wrap: balance に任せる（句の途中で改行され得る）
  expect(verified[1024][0]).toEqual(["作りたい場所", "へ、ワンタップ。"]);
});
