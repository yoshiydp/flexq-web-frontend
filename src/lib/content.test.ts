import { topPageFallback } from "@/content/fallbacks";
import { getNewsArticle, getNewsItems, getTopPageContent } from "./content";

/** Strapi API のレスポンスを差し替える fetch モック */
function mockFetchJson(json: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => json,
  }) as jest.Mock;
}

function mockFetchFailure() {
  global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getTopPageContent", () => {
  it("CMS に到達できない場合はフォールバック全文を返す（ビルドを落とさない）", async () => {
    mockFetchFailure();
    await expect(getTopPageContent()).resolves.toEqual(topPageFallback);
  });

  it("CMS 値がフォールバックより優先される", async () => {
    mockFetchJson({
      data: {
        heroTagline: "CMS Tagline",
        statementHeading: "CMS 見出し",
      },
    });
    const content = await getTopPageContent();
    expect(content.heroTagline).toBe("CMS Tagline");
    expect(content.statement.heading).toBe("CMS 見出し");
  });

  it("CMS 値が空文字・null・空配列のフィールドはフォールバックで補完する", async () => {
    mockFetchJson({
      data: {
        heroTagline: "",
        statementKicker: null,
        features: [],
      },
    });
    const content = await getTopPageContent();
    expect(content.heroTagline).toBe(topPageFallback.heroTagline);
    expect(content.statement.kicker).toBe(topPageFallback.statement.kicker);
    expect(content.features).toEqual(topPageFallback.features);
  });
});

describe("getNewsItems", () => {
  it("Strapi レスポンスをドメイン型（日付整形・カテゴリ名・リンク）にマップする", async () => {
    mockFetchJson({
      data: [
        {
          id: 1,
          title: "配信開始",
          slug: "launch",
          excerpt: "抜粋",
          publishedAt: "2026-06-28T03:00:00.000Z",
          category: { name: "RELEASE" },
          thumbnail: { url: "/uploads/thumb.jpg" },
        },
      ],
    });
    const [item] = await getNewsItems(3);
    expect(item).toEqual({
      id: 1,
      title: "配信開始",
      category: "RELEASE",
      date: "2026.06.28",
      excerpt: "抜粋",
      thumbnailUrl: "http://localhost:1337/uploads/thumb.jpg",
      href: "/news/launch",
    });
  });

  it("取得失敗時は空配列を返す（セクションが非表示になる）", async () => {
    mockFetchFailure();
    await expect(getNewsItems(3)).resolves.toEqual([]);
  });
});

describe("getNewsArticle", () => {
  it("該当 slug がなければ null（= 404）を返す", async () => {
    mockFetchJson({ data: [] });
    await expect(getNewsArticle("no-such-slug")).resolves.toBeNull();
  });

  it("CMS 障害時はエラーを投げる（実在記事を 404 と誤判定しない）", async () => {
    mockFetchFailure();
    await expect(getNewsArticle("launch")).rejects.toThrow();
  });

  it("非 2xx レスポンスもエラーを投げる", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as jest.Mock;
    await expect(getNewsArticle("launch")).rejects.toThrow(
      /Strapi request failed \(503\)/,
    );
  });
});
