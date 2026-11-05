describe("pageMetadata の noindex", () => {
  const originalEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
    jest.resetModules();
  });

  async function load(vercelEnv: string) {
    process.env.VERCEL_ENV = vercelEnv;
    jest.resetModules();
    return (await import("./metadata")).pageMetadata;
  }

  const input = { title: "NEWS", path: "/news" };

  it("本番では noindex のページだけ robots を上書きする", async () => {
    const pageMetadata = await load("production");
    expect(pageMetadata({ ...input, noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
    expect(pageMetadata(input).robots).toBeUndefined();
  });

  it("Preview ではルートの noindex, nofollow を上書きしない", async () => {
    const pageMetadata = await load("preview");
    expect(pageMetadata({ ...input, noindex: true }).robots).toBeUndefined();
  });
});
