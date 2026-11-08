import { expect, test } from "@playwright/test";

/**
 * SEO / OGP / robots / sitemap（docs/test-cases.md「8. SEO / OGP（SE）」）。
 *
 * 表示幅に依存しないため desktop プロジェクトでのみ実行する（playwright.config.ts の testIgnore）。
 * IS_INDEXABLE は VERCEL_ENV=production のときだけ true になるため、
 * ローカル・CI の E2E では常に noindex の出力になる（本番の出力は SE-09 の手動確認）。
 * canonical / og:url のドメインは NEXT_PUBLIC_SITE_URL で変わるため、パス部分だけを検証する。
 */

const PAGES = [
  { path: "/", title: null },
  { path: "/news", title: "NEWS" },
  { path: "/tutorials", title: "TUTORIAL" },
  { path: "/columns", title: "COLUMN" },
  { path: "/terms", title: "TERMS OF SERVICE" },
  { path: "/privacy-policy", title: "PRIVACY POLICY" },
  { path: "/contact", title: "CONTACT" },
] as const;

test.describe("SE SEO / OGP", { tag: "@SE" }, () => {
  test("SE-01 robots.txt は本番以外では全クローラーを拒否する", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    const body = await res.text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/^Disallow: \/$/m);
    expect(body).not.toMatch(/^Allow:/m);
  });

  test("SE-02 sitemap.xml は本番以外では空の urlset を返す", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    expect(body).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(body).not.toContain("<url>");
  });

  test("SE-03 本番以外では全ページが noindex になっている", async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(path);
      await expect(
        page.locator('meta[name="robots"]').first(),
        path,
      ).toHaveAttribute("content", /noindex/);
    }
  });

  test("SE-04 主要ページの title / description / canonical / OGP", async ({
    page,
  }) => {
    for (const { path, title } of PAGES) {
      await page.goto(path);
      const meta = (selector: string) =>
        page.locator(selector).first().getAttribute("content");

      // トップの title は CMS（seoTitle）で変わり得るため、サイト名を含むことだけ見る
      const pageTitle = await page.title();
      if (title) expect(pageTitle, path).toBe(`${title} | FlexQ`);
      else expect(pageTitle, path).toContain("FlexQ");

      expect(await meta('meta[name="description"]'), path).toBeTruthy();

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonical ?? "").pathname, path).toBe(path);
      expect(await meta('meta[property="og:url"]'), path).toBe(canonical);

      expect(await meta('meta[property="og:title"]'), path).toBe(pageTitle);
      expect(await meta('meta[property="og:description"]'), path).toBe(
        await meta('meta[name="description"]'),
      );
      expect(await meta('meta[property="og:type"]'), path).toBe("website");
      expect(await meta('meta[property="og:locale"]'), path).toBe("ja_JP");
      expect(await meta('meta[property="og:site_name"]'), path).toBe("FlexQ");
      expect(await meta('meta[property="og:image"]'), path).toMatch(
        /^https?:\/\/.+\/og\.png$/,
      );
      expect(await meta('meta[name="twitter:card"]'), path).toBe(
        "summary_large_image",
      );
      expect(await meta('meta[name="twitter:image"]'), path).toMatch(
        /\/og\.png$/,
      );
    }
  });

  test("SE-05 OG 画像が 1200x630 の PNG で配信される", async ({ request }) => {
    const res = await request.get("/og.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    // PNG の IHDR チャンク（先頭 16 バイト目から幅・高さが 4 バイトずつ）
    const png = await res.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test("SE-06 トップページに構造化データ（JSON-LD）が出力される", async ({
    page,
  }) => {
    await page.goto("/");
    const json = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    const data = JSON.parse(json ?? "{}") as {
      "@graph": {
        "@type": string;
        offers?: { price: string };
        installUrl?: string;
      }[];
    };
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "MobileApplication"]);
    const app = data["@graph"].find((n) => n["@type"] === "MobileApplication");
    expect(app?.offers?.price).toBe("0");
    expect(app?.installUrl).toMatch(/^https:\/\/apps\.apple\.com\//);
  });

  test("SE-11 ファビコン（ico / svg / apple-touch-icon）が出力・配信される", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((links) =>
        links.map((l) => ({
          rel: l.getAttribute("rel"),
          type: l.getAttribute("type"),
          href: new URL(l.getAttribute("href") ?? "", location.href).pathname,
        })),
      );
    const find = (rel: string, pathPrefix: string) =>
      hrefs.find((h) => h.rel === rel && h.href.startsWith(pathPrefix));
    expect(find("icon", "/favicon.ico"), JSON.stringify(hrefs)).toBeTruthy();
    expect(find("icon", "/icon.svg")?.type).toBe("image/svg+xml");
    const apple = find("apple-touch-icon", "/apple-icon.png");
    expect(apple, JSON.stringify(hrefs)).toBeTruthy();

    const ico = await request.get("/favicon.ico");
    expect(ico.status()).toBe(200);
    // ICO ヘッダー（予約 0・種別 1 = アイコン）と 16 / 32 / 48px の 3 枚
    const icoBody = await ico.body();
    expect(icoBody.readUInt16LE(2)).toBe(1);
    expect(icoBody.readUInt16LE(4)).toBe(3);

    const svg = await request.get("/icon.svg");
    expect(svg.status()).toBe(200);
    expect(svg.headers()["content-type"]).toContain("image/svg+xml");
    // Next.js 雛形の Vercel ロゴ（黒丸に白三角）ではなく、紫背景 + ゴールドの Q
    const svgText = await svg.text();
    expect(svgText).toContain('fill="#6C3483"');
    expect(svgText).toContain('fill="#FFD700"');

    const png = await request.get(apple?.href ?? "/apple-icon.png");
    expect(png.status()).toBe(200);
    expect(png.headers()["content-type"]).toBe("image/png");
    const pngBody = await png.body();
    expect(pngBody.readUInt32BE(16)).toBe(180);
    expect(pngBody.readUInt32BE(20)).toBe(180);
  });

  test("SE-10 正規ドメイン以外のホストは正規ドメインへ 308 で転送する", async ({
    request,
  }) => {
    for (const host of [
      "www.flexqstudio.com",
      "flexq-web-frontend.vercel.app",
    ]) {
      const res = await request.get("/contact", {
        headers: { host },
        maxRedirects: 0,
      });
      expect(res.status(), host).toBe(308);
      expect(res.headers().location, host).toBe(
        "https://flexqstudio.com/contact",
      );
    }
  });
});
