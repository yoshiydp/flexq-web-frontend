import { strapiMediaUrl } from "./strapi";

describe("strapiMediaUrl", () => {
  it("null / undefined / url なしは null を返す", () => {
    expect(strapiMediaUrl(null)).toBeNull();
    expect(strapiMediaUrl(undefined)).toBeNull();
  });

  it("相対パスは STRAPI_URL を前置して絶対 URL にする", () => {
    expect(strapiMediaUrl({ url: "/uploads/thumb.jpg" })).toBe(
      "http://localhost:1337/uploads/thumb.jpg",
    );
  });

  it("絶対 URL（S3 など外部ストレージ）はそのまま返す", () => {
    expect(
      strapiMediaUrl({ url: "https://cdn.example.com/thumb.jpg" }),
    ).toBe("https://cdn.example.com/thumb.jpg");
  });
});
