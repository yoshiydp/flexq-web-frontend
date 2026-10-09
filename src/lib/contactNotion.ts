import { Client } from "@notionhq/client";
import type { ContactValues } from "@/lib/contact";
import type { ContactAttachment } from "@/lib/contactMail";

/**
 * お問い合わせ台帳（Notion データベース「お問い合わせ一覧」）への書き込み。
 *
 * 1 件の問い合わせを 1 ページとして追加し、添付ファイルは Notion の File Upload API で
 * 「添付ファイル」プロパティに保存する。ステータス・担当・メモは運営者が Notion 上で更新する。
 *
 * 環境変数:
 *   NOTION_TOKEN                   … 内部インテグレーションのシークレット。
 *                                    インテグレーションを台帳のページに「接続」しておくこと
 *   NOTION_CONTACT_DATA_SOURCE_ID  … 台帳データベースの data source ID
 * どちらかが未設定なら台帳には書かない（メールだけで運用できる）。
 *
 * プロパティ名は Notion 側の定義と一致させる（変更したら両方直す）。
 */

const PROP = {
  title: "件名",
  status: "ステータス",
  subject: "目的",
  email: "メールアドレス",
  message: "お問い合わせ内容",
  files: "添付ファイル",
  receivedAt: "受信日時",
  senderMailFailed: "控えメール未達",
} as const;

const INITIAL_STATUS = "新着";
/** Notion の rich text は 1 要素 2000 文字まで */
const RICH_TEXT_LIMIT = 2000;

export type LedgerEntry = {
  pageId: string;
  url: string;
};

export type ContactLedger = {
  /** 1 件追加して、作成したページを返す */
  record(
    values: ContactValues,
    attachments: ContactAttachment[],
    receivedAt: Date,
  ): Promise<LedgerEntry>;
  /** 送信者宛の受付メールが失敗したことを記録する */
  markSenderMailFailed(pageId: string): Promise<void>;
};

type Env = Record<string, string | undefined>;

export function isNotionLedgerConfigured(env: Env = process.env): boolean {
  return Boolean(env.NOTION_TOKEN && env.NOTION_CONTACT_DATA_SOURCE_ID);
}

/** 受信日時を件名用に JST で整形する（例: 2026-10-03 14:05） */
export function formatReceivedAt(date: Date): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function buildLedgerTitle(values: ContactValues, receivedAt: Date): string {
  return `${values.subject} ${formatReceivedAt(receivedAt)}`;
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += RICH_TEXT_LIMIT) {
    chunks.push(text.slice(i, i + RICH_TEXT_LIMIT));
  }
  return chunks.length > 0 ? chunks : [""];
}

function richText(text: string) {
  return chunkText(text).map((content) => ({ text: { content } }));
}

/**
 * ページ本文: 本文の全文を入れる。
 * 行ごとにブロックを作ると、改行の多い本文で Notion の上限（1 リクエスト 100 ブロック）を
 * 超えて作成に失敗するため、改行を保ったまま 2000 文字単位の段落にまとめる
 * （本文は最大 2000 文字なので通常は 1 段落）。
 */
function buildBodyBlocks(values: ContactValues) {
  return [
    {
      object: "block" as const,
      type: "heading_3" as const,
      heading_3: { rich_text: [{ text: { content: "お問い合わせ内容" } }] },
    },
    ...chunkText(values.message).map((chunk) => ({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: { rich_text: [{ text: { content: chunk } }] },
    })),
  ];
}

export function createNotionLedger(env: Env = process.env): ContactLedger | null {
  const token = env.NOTION_TOKEN;
  const dataSourceId = env.NOTION_CONTACT_DATA_SOURCE_ID;
  if (!token || !dataSourceId) return null;

  const notion = new Client({ auth: token });

  async function uploadAttachment(attachment: ContactAttachment) {
    const upload = await notion.fileUploads.create({
      mode: "single_part",
      filename: attachment.filename,
      content_type: attachment.contentType,
    });
    await notion.fileUploads.send({
      file_upload_id: upload.id,
      file: {
        filename: attachment.filename,
        data: new Blob([new Uint8Array(attachment.content)], {
          type: attachment.contentType,
        }),
      },
    });
    return {
      type: "file_upload" as const,
      file_upload: { id: upload.id },
      name: attachment.filename,
    };
  }

  return {
    async record(values, attachments, receivedAt) {
      const files = [];
      for (const attachment of attachments) {
        files.push(await uploadAttachment(attachment));
      }
      const page = await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: dataSourceId },
        properties: {
          [PROP.title]: {
            title: [{ text: { content: buildLedgerTitle(values, receivedAt) } }],
          },
          [PROP.status]: { select: { name: INITIAL_STATUS } },
          [PROP.subject]: { select: { name: values.subject } },
          [PROP.email]: { email: values.email },
          [PROP.message]: { rich_text: richText(values.message) },
          [PROP.files]: { files },
          [PROP.receivedAt]: { date: { start: receivedAt.toISOString() } },
          [PROP.senderMailFailed]: { checkbox: false },
        },
        children: buildBodyBlocks(values),
      });
      const url = "url" in page ? page.url : `https://www.notion.so/${page.id.replace(/-/g, "")}`;
      return { pageId: page.id, url };
    },

    async markSenderMailFailed(pageId) {
      await notion.pages.update({
        page_id: pageId,
        properties: { [PROP.senderMailFailed]: { checkbox: true } },
      });
    },
  };
}
