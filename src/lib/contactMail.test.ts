/**
 * @jest-environment node
 */
import {
  buildOperatorMail,
  buildSenderMail,
  createLogTransport,
  createMailTransport,
  createSesTransport,
  operatorAddress,
  resolveMailProvider,
} from "./contactMail";
import { CONTACT_EMAIL } from "./site";

const sendMail = jest.fn();
jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail })) },
}));
jest.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: jest.fn(function (this: { config: unknown }, config: unknown) {
    this.config = config;
  }),
  SendEmailCommand: jest.fn(),
}));

import nodemailer from "nodemailer";
import { SESv2Client } from "@aws-sdk/client-sesv2";

const VALUES = {
  subject: "不具合の報告" as const,
  email: "user@example.com",
  message: "録音が保存されません。\n再現手順: ...",
};
const ATTACHMENT = {
  filename: "screenshot.png",
  contentType: "image/png",
  content: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

beforeEach(() => {
  jest.clearAllMocks();
  sendMail.mockResolvedValue({ messageId: "x" });
});

describe("buildOperatorMail", () => {
  it("運営者宛に内容・添付を載せ、返信先を送信者にする", () => {
    const mail = buildOperatorMail(VALUES, [ATTACHMENT], {});
    expect(mail.to).toBe(CONTACT_EMAIL);
    expect(mail.replyTo).toBe(VALUES.email);
    expect(mail.subject).toContain("不具合の報告");
    expect(mail.text).toContain("新しいお問い合わせが届きました");
    expect(mail.text).toContain(VALUES.email);
    expect(mail.text).toContain("録音が保存されません。");
    expect(mail.text).toContain("screenshot.png");
    expect(mail.attachments).toEqual([ATTACHMENT]);
  });

  it("notes を本文末尾（署名の前）に差し込む", () => {
    const text = buildOperatorMail(VALUES, [], {}, ["Notion 台帳: https://notion.so/x"]).text;
    expect(text).toContain("Notion 台帳: https://notion.so/x");
    expect(text.indexOf("Notion 台帳")).toBeLessThan(text.indexOf("より自動送信"));
  });

  it("CONTACT_TO_EMAIL で受信先を上書きできる（サンドボックスでのテスト用）", () => {
    expect(operatorAddress({ CONTACT_TO_EMAIL: "dev@example.com" })).toBe("dev@example.com");
    expect(operatorAddress({ CONTACT_TO_EMAIL: "  " })).toBe(CONTACT_EMAIL);
    expect(buildOperatorMail(VALUES, [], { CONTACT_TO_EMAIL: "dev@example.com" }).to).toBe(
      "dev@example.com",
    );
  });
});

describe("buildSenderMail", () => {
  it("送信者宛に受付完了と入力内容の控えを載せ、添付は名前だけにする", () => {
    const mail = buildSenderMail(VALUES, [ATTACHMENT]);
    expect(mail.to).toBe(VALUES.email);
    expect(mail.replyTo).toBeUndefined();
    expect(mail.subject).toContain("受け付けました");
    expect(mail.text).toContain("録音が保存されません。");
    expect(mail.text).toContain("screenshot.png");
    expect(mail.attachments).toBeUndefined();
  });

  it("添付がなければ「なし」と表示する", () => {
    expect(buildSenderMail(VALUES, []).text).toContain("添付ファイル:       なし");
  });
});

describe("resolveMailProvider", () => {
  it("明示指定を優先する", () => {
    expect(resolveMailProvider({ CONTACT_MAIL_PROVIDER: "ses" })).toBe("ses");
    expect(resolveMailProvider({ CONTACT_MAIL_PROVIDER: "Resend", RESEND_API_KEY: "k" })).toBe(
      "resend",
    );
    expect(resolveMailProvider({ CONTACT_MAIL_PROVIDER: "log", NODE_ENV: "production" })).toBe(
      "log",
    );
  });

  it("未指定なら認証情報から推定する（SES 優先）", () => {
    expect(resolveMailProvider({ AWS_SES_ACCESS_KEY_ID: "a", RESEND_API_KEY: "k" })).toBe("ses");
    expect(resolveMailProvider({ RESEND_API_KEY: "k" })).toBe("resend");
    expect(resolveMailProvider({ NODE_ENV: "development" })).toBe("log");
  });

  it("不正な指定・本番で未設定は例外", () => {
    expect(() => resolveMailProvider({ CONTACT_MAIL_PROVIDER: "smtp" })).toThrow(/ses \/ resend \/ log/);
    expect(() => resolveMailProvider({ NODE_ENV: "production" })).toThrow(/未設定/);
  });
});

describe("createSesTransport", () => {
  it("SES v2 クライアントと nodemailer の SES トランスポートで送る", async () => {
    const send = createSesTransport({
      AWS_SES_REGION: "us-east-1",
      AWS_SES_ACCESS_KEY_ID: "AKIA",
      AWS_SES_SECRET_ACCESS_KEY: "secret",
      CONTACT_FROM_EMAIL: "Dev <dev@example.com>",
    });
    expect(SESv2Client).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: { accessKeyId: "AKIA", secretAccessKey: "secret" },
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ SES: expect.objectContaining({ sesClient: expect.anything() }) }),
    );

    await send(buildOperatorMail(VALUES, [ATTACHMENT], {}));
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Dev <dev@example.com>",
        to: CONTACT_EMAIL,
        replyTo: VALUES.email,
        attachments: [
          { filename: "screenshot.png", content: ATTACHMENT.content, contentType: "image/png" },
        ],
      }),
    );
  });

  it("キー未設定なら既定のリージョンと資格情報チェーンに任せる", () => {
    createSesTransport({});
    expect(SESv2Client).toHaveBeenCalledWith({ region: "ap-northeast-1" });
  });
});

describe("createMailTransport", () => {
  it("log プロバイダは送信せずログに出す", async () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    await createLogTransport()(buildSenderMail(VALUES, []));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("log プロバイダ"), expect.anything());
    spy.mockRestore();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("resend は API キーが必須", () => {
    expect(() => createMailTransport("resend", {})).toThrow(/RESEND_API_KEY/);
  });
});
