/**
 * @jest-environment node
 */
import { CONTACT_MIN_FILL_MS, issueContactToken } from "@/lib/contactGuard";

const deliver = jest.fn();
jest.mock("@/lib/contactDelivery", () => ({
  getContactDelivery: () => deliver,
}));
let ip = "203.0.113.1";
jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` }),
}));

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    subject: "その他",
    email: "user@example.com",
    message: "本文",
    website: "",
    token: issueContactToken(Date.now() - CONTACT_MIN_FILL_MS - 1_000),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

/** モジュール内の状態（連投・回数制限）をテストごとに作り直す */
async function loadAction() {
  jest.resetModules();
  const mod = await import("./actions");
  return mod.sendContact;
}

beforeEach(() => {
  deliver.mockReset();
  deliver.mockResolvedValue(undefined);
  ip = "203.0.113.1";
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("sendContact", () => {
  it("配送に成功した同一内容の再送は、配送せず完了扱いにする", async () => {
    const sendContact = await loadAction();
    expect(await sendContact(form())).toEqual({ ok: true });
    expect(await sendContact(form())).toEqual({ ok: true });
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it("配送に失敗した送信は記憶せず、再送でもう一度配送する", async () => {
    const sendContact = await loadAction();
    deliver.mockRejectedValueOnce(new Error("down"));
    expect((await sendContact(form())).ok).toBe(false);
    expect(await sendContact(form())).toEqual({ ok: true });
    expect(deliver).toHaveBeenCalledTimes(2);
  });

  it("同じ内容が同時に届いたら 1 回の配送にまとめる", async () => {
    const sendContact = await loadAction();
    let release!: () => void;
    deliver.mockImplementationOnce(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    // 待ちを挟まず同時に呼ぶ（判定と登録の間に await があると両方が配送に進んでしまう）
    const first = sendContact(form());
    const second = sendContact(form());
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    expect(await Promise.all([first, second])).toEqual([{ ok: true }, { ok: true }]);
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it("同じ宛先へは本文を変えても 3 回までしか送れない", async () => {
    const sendContact = await loadAction();
    for (let i = 0; i < 3; i++) {
      ip = `203.0.113.${10 + i}`;
      expect(await sendContact(form({ message: `本文 ${i}` }))).toEqual({ ok: true });
    }
    ip = "203.0.113.99";
    const blocked = await sendContact(form({ message: "本文 4" }));
    expect(blocked.ok).toBe(false);
    expect(deliver).toHaveBeenCalledTimes(3);
  });

  it("同じ IP からは宛先を変えても 5 回までしか送れない", async () => {
    const sendContact = await loadAction();
    for (let i = 0; i < 5; i++) {
      expect(await sendContact(form({ email: `user${i}@example.com` }))).toEqual({ ok: true });
    }
    const blocked = await sendContact(form({ email: "user9@example.com" }));
    expect(blocked.ok).toBe(false);
    expect(deliver).toHaveBeenCalledTimes(5);
  });

  it("ハニーポット・早すぎる送信は配送しない", async () => {
    const sendContact = await loadAction();
    expect(await sendContact(form({ website: "http://spam.example" }))).toEqual({ ok: true });
    const tooFast = await sendContact(form({ token: issueContactToken(Date.now()) }));
    expect(tooFast.ok).toBe(false);
    expect(deliver).not.toHaveBeenCalled();
  });
});
