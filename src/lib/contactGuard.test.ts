import {
  RateLimiter,
  CONTACT_MIN_FILL_MS,
  CONTACT_TOKEN_MAX_AGE_MS,
  RecentSubmissions,
  checkContactToken,
  contactFingerprint,
  isHoneypotFilled,
  issueContactToken,
} from "./contactGuard";

describe("checkContactToken", () => {
  const issuedAt = 1_800_000_000_000;

  it("最小入力時間を過ぎていれば ok", () => {
    const token = issueContactToken(issuedAt);
    expect(checkContactToken(token, issuedAt + CONTACT_MIN_FILL_MS)).toBe("ok");
  });

  it("発行直後の送信は too_fast", () => {
    const token = issueContactToken(issuedAt);
    expect(checkContactToken(token, issuedAt + 500)).toBe("too_fast");
  });

  it("有効期限を過ぎたトークンは expired", () => {
    const token = issueContactToken(issuedAt);
    expect(
      checkContactToken(token, issuedAt + CONTACT_TOKEN_MAX_AGE_MS + 1),
    ).toBe("expired");
  });

  it("署名や発行時刻を改ざんしたトークンは invalid", () => {
    const token = issueContactToken(issuedAt);
    const [, signature] = token.split(".");
    expect(checkContactToken(`${issuedAt - 60_000}.${signature}`)).toBe(
      "invalid",
    );
    expect(checkContactToken(`${issuedAt}.deadbeef`)).toBe("invalid");
    expect(checkContactToken("")).toBe("invalid");
    expect(checkContactToken(undefined)).toBe("invalid");
  });
});

describe("isHoneypotFilled", () => {
  it("空・未定義・空白のみは人間扱い", () => {
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled("   ")).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
  });

  it("値が入っていれば bot 扱い", () => {
    expect(isHoneypotFilled("http://spam.example")).toBe(true);
  });
});

describe("RecentSubmissions", () => {
  it("記録済みの内容を時間内に再送すると重複扱い、時間を過ぎれば通す", () => {
    const recent = new RecentSubmissions(1_000);
    const fp = contactFingerprint("その他", "同じ本文");
    expect(recent.isDuplicate(fp, 0)).toBe(false);
    recent.remember(fp, 0);
    expect(recent.isDuplicate(fp, 500)).toBe(true);
    expect(recent.isDuplicate(fp, 2_000)).toBe(false);
  });

  it("判定だけでは記録しない（配送に失敗した送信の再送を弾かない）", () => {
    const recent = new RecentSubmissions(1_000);
    const fp = contactFingerprint("その他", "配送に失敗した本文");
    expect(recent.isDuplicate(fp, 0)).toBe(false);
    expect(recent.isDuplicate(fp, 100)).toBe(false);
  });

  it("内容が違えば重複にならない", () => {
    const recent = new RecentSubmissions();
    recent.remember(contactFingerprint("A", "本文"), 0);
    expect(recent.isDuplicate(contactFingerprint("B", "本文"), 0)).toBe(false);
  });
});

describe("RateLimiter", () => {
  it("window 内は limit 回まで許可し、超えたら拒否、時間が過ぎれば回復する", () => {
    const limiter = new RateLimiter(2, 1_000);
    expect(limiter.allow("ip", 0)).toBe(true);
    expect(limiter.allow("ip", 100)).toBe(true);
    expect(limiter.allow("ip", 200)).toBe(false);
    // 拒否された試行は回数に数えない
    expect(limiter.allow("ip", 1_050)).toBe(true);
    expect(limiter.allow("ip", 1_060)).toBe(false);
  });

  it("key ごとに独立して数える", () => {
    const limiter = new RateLimiter(1, 1_000);
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(false);
  });
});

describe("contactFingerprint", () => {
  const file = (filename: string, bytes: number[]) => ({
    filename,
    content: Buffer.from(bytes),
  });

  it("添付の有無・名前・中身が違えば別の fingerprint になる", () => {
    const base = contactFingerprint("その他", "本文");
    const withFile = contactFingerprint("その他", "本文", [file("a.png", [1, 2])]);
    expect(withFile).not.toBe(base);
    expect(contactFingerprint("その他", "本文", [file("a.png", [1, 3])])).not.toBe(withFile);
    expect(contactFingerprint("その他", "本文", [file("b.png", [1, 2])])).not.toBe(withFile);
    expect(contactFingerprint("その他", "本文", [file("a.png", [1, 2])])).toBe(withFile);
  });
});

describe("hasExpectedFileSignature", () => {
  const { hasExpectedFileSignature } = jest.requireActual("./contactGuard");

  it("PNG / JPEG / PDF の先頭バイトを判定する", () => {
    expect(
      hasExpectedFileSignature(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
        "image/png",
      ),
    ).toBe(true);
    expect(
      hasExpectedFileSignature(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    ).toBe(true);
    expect(
      hasExpectedFileSignature(Buffer.from("%PDF-1.7"), "application/pdf"),
    ).toBe(true);
  });

  it("中身が別形式・未知の MIME は false", () => {
    expect(
      hasExpectedFileSignature(Buffer.from("%PDF-1.7"), "image/png"),
    ).toBe(false);
    expect(hasExpectedFileSignature(Buffer.from([0x89]), "image/png")).toBe(false);
    expect(hasExpectedFileSignature(Buffer.from("GIF89a"), "image/gif")).toBe(false);
  });
});
