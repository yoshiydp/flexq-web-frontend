const getAllArticlePaths = jest.fn<Promise<string[]>, []>();

jest.mock("@/lib/content", () => ({
  getAllArticlePaths: () => getAllArticlePaths(),
}));

describe("sitemap", () => {
  const originalEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
    jest.resetModules();
  });

  async function urls(vercelEnv: string) {
    process.env.VERCEL_ENV = vercelEnv;
    jest.resetModules();
    const { default: sitemap } = await import("./sitemap");
    return (await sitemap()).map(({ url }) => new URL(url).pathname);
  }

  it("Preview では空を返す", async () => {
    getAllArticlePaths.mockResolvedValue(["/news/hello"]);
    expect(await urls("preview")).toEqual([]);
  });

  it("記事が 0 件の間は一覧ページを載せない", async () => {
    getAllArticlePaths.mockResolvedValue([]);
    const paths = await urls("production");
    expect(paths).toEqual(
      expect.arrayContaining(["/", "/terms", "/privacy-policy", "/contact"]),
    );
    for (const list of ["/news", "/tutorials", "/columns"]) {
      expect(paths).not.toContain(list);
    }
  });

  it("記事がある一覧ページだけを記事とあわせて載せる", async () => {
    getAllArticlePaths.mockResolvedValue(["/columns/hello"]);
    const paths = await urls("production");
    expect(paths).toEqual(
      expect.arrayContaining(["/columns", "/columns/hello"]),
    );
    expect(paths).not.toContain("/news");
    expect(paths).not.toContain("/tutorials");
  });
});
