import {
  CONTACT_ATTACHMENT_MAX_FILES,
  CONTACT_ATTACHMENT_MAX_FILE_BYTES,
  CONTACT_ATTACHMENT_MAX_TOTAL_BYTES,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_SUBJECTS,
  canProceedToConfirm,
  formatBytes,
  resolveAttachmentType,
  validateAttachments,
  validateContact,
} from "./contact";

const VALID = {
  subject: CONTACT_SUBJECTS[0],
  email: "user@example.com",
  message: "本文",
};

describe("validateContact", () => {
  it("目的・メール・本文が揃っていれば正規化した値を返す", () => {
    const result = validateContact({
      ...VALID,
      email: "  user@example.com ",
      message: "  アプリの使い方を教えてください。  ",
    });
    expect(result).toEqual({
      ok: true,
      values: {
        subject: CONTACT_SUBJECTS[0],
        email: "user@example.com",
        message: "アプリの使い方を教えてください。",
      },
    });
  });

  it("本文の CRLF は LF に正規化する", () => {
    const result = validateContact({ ...VALID, message: "1 行目\r\n2 行目\r3 行目" });
    expect(result.ok && result.values.message).toBe("1 行目\n2 行目\n3 行目");
  });

  it("目的が選択肢にない場合はエラーになる", () => {
    const result = validateContact({ ...VALID, subject: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.subject).toBeDefined();
      expect(result.errors.email).toBeUndefined();
      expect(result.errors.message).toBeUndefined();
    }
  });

  it("メールアドレスが空・不正な形式の場合はエラーになる", () => {
    for (const email of ["", "   ", "not-an-email", "a@b", "a b@example.com"]) {
      const result = validateContact({ ...VALID, email });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.email).toBeDefined();
    }
  });

  it("表示名・コメント・複数指定など、宛先を別解釈され得る書き方は弾く", () => {
    for (const email of [
      "victim@example.com(one)",
      "(one)victim@example.com",
      "Name <victim@example.com>",
      "a@example.com,b@example.com",
      "a@example.com;b@example.com",
      "\"a b\"@example.com",
      "a@example..com",
      "a@-example.com",
    ]) {
      expect(validateContact({ ...VALID, email }).ok).toBe(false);
    }
    for (const email of ["first.last+tag@sub.example.co.jp", "a_b-c@example.io"]) {
      expect(validateContact({ ...VALID, email }).ok).toBe(true);
    }
  });

  it("本文が空白のみ・上限超過の場合はエラーになる", () => {
    expect(validateContact({ ...VALID, message: "   \n  " }).ok).toBe(false);
    expect(
      validateContact({
        ...VALID,
        message: "あ".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
      }).ok,
    ).toBe(false);
  });
});

describe("canProceedToConfirm", () => {
  it("必須 3 項目がすべて入力されていれば true", () => {
    expect(canProceedToConfirm(VALID)).toBe(true);
  });

  it("いずれかが未入力なら false", () => {
    expect(canProceedToConfirm({ ...VALID, subject: "" })).toBe(false);
    expect(canProceedToConfirm({ ...VALID, email: "  " })).toBe(false);
    expect(canProceedToConfirm({ ...VALID, message: "  " })).toBe(false);
  });

  it("メールの形式は見ない（形式エラーは確認時に表示する）", () => {
    expect(canProceedToConfirm({ ...VALID, email: "abc" })).toBe(true);
  });
});

describe("resolveAttachmentType", () => {
  it("MIME と拡張子が一致すれば種別を返す", () => {
    expect(resolveAttachmentType({ name: "a.png", type: "image/png" })).toBe(
      "image/png",
    );
    expect(resolveAttachmentType({ name: "a.JPG", type: "image/jpeg" })).toBe(
      "image/jpeg",
    );
    expect(
      resolveAttachmentType({ name: "a.pdf", type: "application/pdf" }),
    ).toBe("application/pdf");
  });

  it("MIME が空・application/octet-stream なら拡張子だけで判定する", () => {
    expect(resolveAttachmentType({ name: "a.jpeg", type: "" })).toBe(
      "image/jpeg",
    );
    expect(
      resolveAttachmentType({ name: "a.pdf", type: "application/octet-stream" }),
    ).toBe("application/pdf");
    expect(
      resolveAttachmentType({ name: "a.exe", type: "application/octet-stream" }),
    ).toBeNull();
  });

  it("対象外の形式・MIME と拡張子の不一致は null", () => {
    expect(resolveAttachmentType({ name: "a.gif", type: "image/gif" })).toBeNull();
    expect(resolveAttachmentType({ name: "a.png", type: "application/pdf" })).toBeNull();
    expect(resolveAttachmentType({ name: "noext", type: "image/png" })).toBeNull();
  });
});

describe("validateAttachments", () => {
  const png = (name: string, size = 1000) => ({ name, type: "image/png", size });

  it("空・条件内ならエラーなし", () => {
    expect(validateAttachments([])).toBeNull();
    expect(validateAttachments([png("a.png"), png("b.png")])).toBeNull();
  });

  it("件数・1 ファイルサイズ・合計サイズの上限を超えるとエラー", () => {
    expect(
      validateAttachments(
        Array.from({ length: CONTACT_ATTACHMENT_MAX_FILES + 1 }, (_, i) =>
          png(`${i}.png`),
        ),
      ),
    ).toMatch(/件まで/);
    expect(
      validateAttachments([png("big.png", CONTACT_ATTACHMENT_MAX_FILE_BYTES + 1)]),
    ).toMatch(/上限/);
    expect(
      validateAttachments([
        png("a.png", CONTACT_ATTACHMENT_MAX_FILE_BYTES),
        png("b.png", CONTACT_ATTACHMENT_MAX_TOTAL_BYTES - CONTACT_ATTACHMENT_MAX_FILE_BYTES + 1),
      ]),
    ).toMatch(/合計/);
  });

  it("対象外の形式はファイル名入りのエラー", () => {
    expect(
      validateAttachments([{ name: "memo.txt", type: "text/plain", size: 10 }]),
    ).toMatch(/memo\.txt/);
  });
});

describe("formatBytes", () => {
  it("単位を切り替えて表示する", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
