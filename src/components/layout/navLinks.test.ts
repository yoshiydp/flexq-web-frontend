import { NAV_LINKS, visibleNavLinks } from "./navLinks";

describe("visibleNavLinks", () => {
  it("コンテンツが揃っていれば全リンクを返す", () => {
    expect(visibleNavLinks({ hasNews: true, hasLearn: true })).toEqual(
      NAV_LINKS,
    );
  });

  it("News が空なら NEWS アンカーを除外する", () => {
    const links = visibleNavLinks({ hasNews: false, hasLearn: true });
    expect(links.map((l) => l.label)).toEqual([
      "FEATURES",
      "PREVIEW",
      "LEARN",
      "FAQ",
    ]);
  });

  it("Tutorial / Column が両方空なら LEARN アンカーを除外する", () => {
    const links = visibleNavLinks({ hasNews: true, hasLearn: false });
    expect(links.map((l) => l.label)).toEqual([
      "FEATURES",
      "PREVIEW",
      "NEWS",
      "FAQ",
    ]);
  });
});
