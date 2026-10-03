import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";
import type { ContactValues } from "@/lib/contact";
import { formatBytes } from "@/lib/contact";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * お問い合わせの通知メール（サーバー専用。Server Action からのみ呼ぶ）。
 *
 * 1 件の送信につき 2 通送る:
 *   - 運営者宛（CONTACT_EMAIL）… 新着通知 + 内容 + 添付ファイル。返信先は送信者のアドレス
 *   - 送信者宛（入力されたアドレス）… 受付完了のお知らせ + 入力内容の控え（添付はファイル名のみ）
 *
 * ここにあるのは「メールの組み立て」と「1 通をどのサービスで送るか」（MailTransport: ses / resend / log）。
 * 「1 件の問い合わせをどう処理するか」（台帳 + メール 2 通）は src/lib/contactDelivery.ts。
 *
 * 環境変数:
 *   CONTACT_MAIL_PROVIDER     … ses | resend | log。未設定なら認証情報の有無から推定する
 *                               （AWS_SES_ACCESS_KEY_ID → ses、RESEND_API_KEY → resend、
 *                               どちらもなければ開発環境は log、本番はエラー）
 *   AWS_SES_REGION            … SES のリージョン（既定: ap-northeast-1）
 *   AWS_SES_ACCESS_KEY_ID / AWS_SES_SECRET_ACCESS_KEY
 *                             … 送信専用 IAM ユーザーのキー。開発中は開発者アカウント、
 *                               リリース前に運営者アカウントの値へ差し替える。
 *                               （Vercel が予約している AWS_ACCESS_KEY_ID とは別名にしてある）
 *   RESEND_API_KEY            … Resend を使う場合の API キー
 *   CONTACT_FROM_EMAIL        … 差出人。SES / Resend で検証済みのアドレスにする
 *                               （既定: FlexQ Contact <noreply@flexqstudio.com>）
 *   CONTACT_TO_EMAIL          … 運営者宛の受信先を上書きする（SES サンドボックスでのテスト用。
 *                               既定: CONTACT_EMAIL = contact@flexqstudio.com）
 */

export type ContactAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
};

export type ContactMail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: ContactAttachment[];
};

export type ContactDelivery = (
  values: ContactValues,
  attachments: ContactAttachment[],
) => Promise<void>;

export type MailTransport = (mail: ContactMail) => Promise<void>;

export type ContactMailProvider = "ses" | "resend" | "log";

const PROVIDERS: readonly ContactMailProvider[] = ["ses", "resend", "log"];
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = `${SITE_NAME} Contact <noreply@flexqstudio.com>`;
const DEFAULT_SES_REGION = "ap-northeast-1";
const DIVIDER = "────────────────────────";

type Env = Record<string, string | undefined>;

// ---------------------------------------------------------------------------
// メール本文
// ---------------------------------------------------------------------------

function describeAttachments(attachments: ContactAttachment[]): string {
  if (attachments.length === 0) return "なし";
  return attachments
    .map((a) => `${a.filename}（${formatBytes(a.content.byteLength)}）`)
    .join("\n              ");
}

function summary(values: ContactValues, attachments: ContactAttachment[]) {
  return [
    DIVIDER,
    `お問い合わせの目的: ${values.subject}`,
    `メールアドレス:     ${values.email}`,
    `添付ファイル:       ${describeAttachments(attachments)}`,
    "",
    "お問い合わせ内容:",
    values.message,
    DIVIDER,
  ].join("\n");
}

/** 運営者宛の受信先。SES サンドボックスでのテスト中は CONTACT_TO_EMAIL で上書きする */
export function operatorAddress(env: Env = process.env): string {
  return env.CONTACT_TO_EMAIL?.trim() || CONTACT_EMAIL;
}

/** 運営者宛: 新着通知 + 内容 + 添付。そのまま返信できるよう reply-to に送信者を入れる */
export function buildOperatorMail(
  values: ContactValues,
  attachments: ContactAttachment[],
  env: Env = process.env,
  /** 台帳 URL や失敗の注記など、本文末尾に添える行 */
  notes: readonly string[] = [],
): ContactMail {
  return {
    to: operatorAddress(env),
    replyTo: values.email,
    subject: `[${SITE_NAME} お問い合わせ] ${values.subject}`,
    text: [
      `${SITE_NAME} の Web サイトから新しいお問い合わせが届きました。`,
      "返信する場合は、このメールにそのまま返信してください（返信先は送信者のメールアドレスです）。",
      "",
      summary(values, attachments),
      "",
      ...(notes.length > 0 ? [...notes, ""] : []),
      `${SITE_NAME} Web お問い合わせフォーム（${SITE_URL}/contact）より自動送信`,
    ].join("\n"),
    attachments,
  };
}

/** 送信者宛: 受付完了のお知らせ + 入力内容の控え（添付ファイルは名前のみ） */
export function buildSenderMail(
  values: ContactValues,
  attachments: ContactAttachment[],
): ContactMail {
  return {
    to: values.email,
    subject: `【${SITE_NAME}】お問い合わせを受け付けました`,
    text: [
      `${SITE_NAME} へお問い合わせいただきありがとうございます。`,
      "以下の内容でお問い合わせを受け付けました。内容を確認のうえ、必要に応じてこのメールアドレス宛にご連絡いたします。",
      "",
      summary(values, attachments),
      "",
      "※ このメールは送信専用のため、返信いただいてもお答えできません。",
      "※ お心当たりがない場合は、お手数ですがこのメールを破棄してください。",
      "",
      SITE_NAME,
      SITE_URL,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// プロバイダの解決
// ---------------------------------------------------------------------------

function isProvider(value: string): value is ContactMailProvider {
  return (PROVIDERS as readonly string[]).includes(value);
}

/**
 * どのサービスで送るかを決める。
 * 明示指定（CONTACT_MAIL_PROVIDER）を優先し、なければ認証情報の有無から推定する。
 * 本番で何も設定されていない場合は、送信できないまま完了画面を出さないよう例外にする。
 */
export function resolveMailProvider(env: Env = process.env): ContactMailProvider {
  const explicit = env.CONTACT_MAIL_PROVIDER?.trim().toLowerCase();
  if (explicit) {
    if (!isProvider(explicit)) {
      throw new Error(
        `CONTACT_MAIL_PROVIDER には ${PROVIDERS.join(" / ")} のいずれかを指定してください（指定値: ${explicit}）`,
      );
    }
    return explicit;
  }
  if (env.AWS_SES_ACCESS_KEY_ID) return "ses";
  if (env.RESEND_API_KEY) return "resend";
  if (env.NODE_ENV === "production") {
    throw new Error(
      "お問い合わせメールの送信先が未設定です（CONTACT_MAIL_PROVIDER / AWS_SES_* / RESEND_API_KEY）",
    );
  }
  return "log";
}

// ---------------------------------------------------------------------------
// トランスポート
// ---------------------------------------------------------------------------

/** SES（raw MIME）。添付付きメールを送るため nodemailer に MIME 組み立てを任せる */
export function createSesTransport(env: Env = process.env): MailTransport {
  const accessKeyId = env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SES_SECRET_ACCESS_KEY;
  const sesClient = new SESv2Client({
    region: env.AWS_SES_REGION || DEFAULT_SES_REGION,
    // キーが未設定なら SDK の既定の資格情報チェーン（IAM ロール等）に任せる
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });
  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  });
  const from = env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

  return async (mail) => {
    await transporter.sendMail({
      from,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      attachments: mail.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  };
}

/** Resend の HTTP API。依存パッケージなしで fetch だけで送れる */
export function createResendTransport(env: Env = process.env): MailTransport {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

  return async (mail) => {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        attachments: mail.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64"),
          content_type: a.contentType,
        })),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend API error: ${res.status} ${detail}`);
    }
  };
}

/** 送信せずコンソールに出すだけ（画面の動作確認用） */
export function createLogTransport(): MailTransport {
  return async (mail) => {
    console.info("[contact] メール送信をスキップ（log プロバイダ）", {
      ...mail,
      attachments: describeAttachments(mail.attachments ?? []),
    });
  };
}

export function createMailTransport(
  provider: ContactMailProvider,
  env: Env = process.env,
): MailTransport {
  switch (provider) {
    case "ses":
      return createSesTransport(env);
    case "resend":
      return createResendTransport(env);
    case "log":
      if (env.NODE_ENV === "production") {
        console.warn("[contact] 本番環境で log プロバイダが指定されています（メールは送信されません）");
      }
      return createLogTransport();
  }
}
