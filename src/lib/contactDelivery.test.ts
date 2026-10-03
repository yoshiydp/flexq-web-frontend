/**
 * @jest-environment node
 */
import { deliverContact, getContactDelivery } from "./contactDelivery";
import type { ContactLedger } from "./contactNotion";
import { CONTACT_EMAIL } from "./site";

const VALUES = {
  subject: "不具合の報告" as const,
  email: "user@example.com",
  message: "本文",
};
const ENTRY = { pageId: "page-1", url: "https://notion.so/page-1" };

function ledger(overrides: Partial<ContactLedger> = {}): jest.Mocked<ContactLedger> {
  return {
    record: jest.fn().mockResolvedValue(ENTRY),
    markSenderMailFailed: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<ContactLedger>;
}

let errorSpy: jest.SpyInstance;
beforeEach(() => {
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

describe("deliverContact", () => {
  it("台帳 → 運営者宛（台帳 URL 付き）→ 送信者宛 の順に処理する", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const l = ledger();
    const now = new Date("2026-10-03T05:00:00Z");
    await deliverContact(VALUES, [], { send, ledger: l, now: () => now }, {});

    expect(l.record).toHaveBeenCalledWith(VALUES, [], now);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].to).toBe(CONTACT_EMAIL);
    expect(send.mock.calls[0][0].text).toContain("Notion 台帳: https://notion.so/page-1");
    expect(send.mock.calls[1][0].to).toBe(VALUES.email);
    expect(l.markSenderMailFailed).not.toHaveBeenCalled();
  });

  it("台帳が未設定でもメール 2 通は送る", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    await deliverContact(VALUES, [], { send, ledger: null }, {});
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].text).not.toContain("Notion 台帳");
  });

  it("台帳が失敗してもメールは送り、運営者宛に転記依頼を注記する", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const l = ledger({ record: jest.fn().mockRejectedValue(new Error("notion down")) });
    await expect(deliverContact(VALUES, [], { send, ledger: l }, {})).resolves.toBeUndefined();
    expect(send.mock.calls[0][0].text).toContain("Notion 台帳への記録に失敗しました");
  });

  it("運営者宛が失敗しても台帳に残っていれば完了扱い（送信者宛は送る）", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error("ses down"))
      .mockResolvedValueOnce(undefined);
    await expect(deliverContact(VALUES, [], { send, ledger: ledger() }, {})).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("台帳にもメールにも残らない場合だけ throw する", async () => {
    const send = jest.fn().mockRejectedValue(new Error("ses down"));
    await expect(deliverContact(VALUES, [], { send, ledger: null }, {})).rejects.toThrow("ses down");
    expect(send).toHaveBeenCalledTimes(1);

    const l = ledger({ record: jest.fn().mockRejectedValue(new Error("notion down")) });
    await expect(deliverContact(VALUES, [], { send, ledger: l }, {})).rejects.toThrow("ses down");
  });

  it("送信者宛が失敗したら台帳の控えメール未達にチェックを付ける", async () => {
    const send = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("bounce"));
    const l = ledger();
    await expect(deliverContact(VALUES, [], { send, ledger: l }, {})).resolves.toBeUndefined();
    expect(l.markSenderMailFailed).toHaveBeenCalledWith("page-1");
  });
});

describe("getContactDelivery", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("メール設定が不正でも、台帳もメールも無い場合に限り例外になる（初期化は送信時）", async () => {
    process.env.CONTACT_MAIL_PROVIDER = "smtp";
    delete process.env.NOTION_TOKEN;
    // 組み立て時点では throw しない
    const delivery = getContactDelivery();
    await expect(delivery(VALUES, [])).rejects.toThrow(/CONTACT_MAIL_PROVIDER/);
  });
});
