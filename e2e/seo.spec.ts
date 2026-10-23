import { expect, test } from "@playwright/test";

/**
 * SEO / OGP / robots / sitemap（docs/test-cases.md「8. SEO / OGP（SE）」）。
 *
 * 表示幅に依存しないため desktop プロジェクトでのみ実行する（playwright.config.ts の testIgnore）。
 * 一般公開前の状態（src/lib/site.ts の ALLOW_INDEXING=false）を前提にする。
 * ALLOW_INDEXING を true にしても、IS_INDEXABLE は VERCEL_ENV=production のときだけ true になるため、
 * ローカル・CI の E2E では常に noindex の出力になる（公開時の出力は SE-09 の手動確認）。
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
  test("SE-01 robots.txt は公開前は全クローラーを拒否する", async ({
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

  test("SE-02 sitemap.xml は公開前は空の urlset を返す", async ({
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

  test("SE-03 全ページが noindex になっている", async ({ page }) => {
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
      "@graph": { "@type": string; offers?: { price: string } }[];
    };
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "MobileApplication"]);
    const app = data["@graph"].find((n) => n["@type"] === "MobileApplication");
    expect(app?.offers?.price).toBe("0");
  });
});
