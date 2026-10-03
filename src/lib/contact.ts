/**
 * お問い合わせフォームのドメイン定義。
 * 選択肢・上限・バリデーションをクライアント（フォーム）とサーバー（Server Action）の
 * 両方から参照し、判定がズレないようにする。
 */

/** お問い合わせの目的（プルダウンの選択肢）。value は送信メールの件名にもそのまま使う */
export const CONTACT_SUBJECTS = [
  "アプリの使い方について",
  "不具合の報告",
  "機能の要望",
  "アカウント・データについて",
  "取材・掲載・提携について",
  "その他",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

/** 本文の上限文字数（メール本文としての現実的な長さ + スパム対策） */
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;

/** メールアドレスの上限（RFC 5321 の 254 文字） */
export const CONTACT_EMAIL_MAX_LENGTH = 254;

/**
 * 添付ファイルの制約。
 * Vercel の Server Action はリクエスト本文 4.5MB が上限のため、
 * 合計 4MB に収める（next.config.ts の bodySizeLimit と対）。
 */
export const CONTACT_ATTACHMENT_MAX_FILES = 3;
export const CONTACT_ATTACHMENT_MAX_FILE_BYTES = 3 * 1024 * 1024;
export const CONTACT_ATTACHMENT_MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** 受け付ける MIME タイプと拡張子。ブラウザによって type が空になることがあるため拡張子でも判定する */
export const CONTACT_ATTACHMENT_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
} as const;

export type ContactAttachmentType = keyof typeof CONTACT_ATTACHMENT_TYPES;

/** `<input type="file" accept>` に渡す値 */
export const CONTACT_ATTACHMENT_ACCEPT = Object.entries(CONTACT_ATTACHMENT_TYPES)
  .flatMap(([mime, exts]) => [mime, ...exts])
  .join(",");

export type ContactInput = {
  subject: string;
  email: string;
  message: string;
};

export type ContactValues = {
  subject: ContactSubject;
  email: string;
  message: string;
};

export type ContactValidation =
  | { ok: true; values: ContactValues }
  | { ok: false; errors: Partial<Record<keyof ContactInput, string>> };

export function isContactSubject(value: string): value is ContactSubject {
  return (CONTACT_SUBJECTS as readonly string[]).includes(value);
}

/**
 * メールアドレスの形式チェック。
 * 「ローカル部@ドメイン」だけを受け付ける。表示名・コメント（`a@b.com(x)`）・山括弧・
 * 複数指定（カンマ / セミコロン）は弾く。メールソフトはこれらを別の宛先として解釈し得るため、
 * 許すと宛先ごとの回数制限をすり抜けたり、意図しない宛先へ送ったりできてしまう。
 * 国際化ドメイン・ローカル部の引用符付き表記は対象外（実利用がほぼ無い）。
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

export function isValidContactEmail(value: string): boolean {
  const email = value.trim();
  return (
    email.length > 0 &&
    email.length <= CONTACT_EMAIL_MAX_LENGTH &&
    EMAIL_PATTERN.test(email)
  );
}

/**
 * 入力値を検証し、正規化した値を返す。
 * 本文・メールは前後の空白を落として判定する（空白だけの入力は未入力扱い）。
 */
export function validateContact(input: ContactInput): ContactValidation {
  const errors: Partial<Record<keyof ContactInput, string>> = {};
  const email = input.email.trim();
  // multipart/form-data は改行を CRLF に正規化して送るため、LF に戻してから扱う
  const message = input.message.replace(/\r\n?/g, "\n").trim();

  if (!isContactSubject(input.subject)) {
    errors.subject = "お問い合わせの目的を選択してください。";
  }
  if (email.length === 0) {
    errors.email = "メールアドレスを入力してください。";
  } else if (!isValidContactEmail(email)) {
    errors.email = "メールアドレスの形式が正しくありません。";
  }
  if (message.length === 0) {
    errors.message = "お問い合わせ内容を入力してください。";
  } else if (message.length > CONTACT_MESSAGE_MAX_LENGTH) {
    errors.message = `お問い合わせ内容は ${CONTACT_MESSAGE_MAX_LENGTH} 文字以内で入力してください。`;
  }

  if (Object.keys(errors).length > 0 || !isContactSubject(input.subject)) {
    return { ok: false, errors };
  }
  return { ok: true, values: { subject: input.subject, email, message } };
}

/**
 * 「入力確認」ボタンの活性判定。
 * 必須項目（目的・メール・本文）がすべて入力されているときだけ押せる。
 * 形式エラーは確認時に表示するため、ここでは「入力があるか」だけを見る。
 */
export function canProceedToConfirm(input: ContactInput): boolean {
  return (
    isContactSubject(input.subject) &&
    input.email.trim().length > 0 &&
    input.message.trim().length > 0
  );
}

/** 添付ファイルのメタ情報（File / サーバー側の受信データ共通） */
export type ContactAttachmentMeta = {
  name: string;
  type: string;
  size: number;
};

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index).toLowerCase();
}

/** ファイル名・MIME タイプから受け付け可能な種別を解決する（不可なら null） */
export function resolveAttachmentType(
  meta: Pick<ContactAttachmentMeta, "name" | "type">,
): ContactAttachmentType | null {
  const ext = extensionOf(meta.name);
  for (const [mime, exts] of Object.entries(CONTACT_ATTACHMENT_TYPES)) {
    const extMatches = (exts as readonly string[]).includes(ext);
    // type が付いていれば MIME と拡張子の両方が一致すること。不明なら拡張子のみで判定する。
    // ブラウザが type を空で渡したファイルは、multipart 送信時に application/octet-stream へ
    // 変わってサーバーに届くため、これも「不明」として扱う（中身はサーバーで先頭バイトを検査する）
    const typeUnknown = meta.type === "" || meta.type === "application/octet-stream";
    if (extMatches && (typeUnknown || meta.type === mime)) {
      return mime as ContactAttachmentType;
    }
  }
  return null;
}

/**
 * 添付ファイル一式を検証する。エラーがあれば最初の 1 件を文言で返す。
 */
export function validateAttachments(
  files: readonly ContactAttachmentMeta[],
): string | null {
  if (files.length > CONTACT_ATTACHMENT_MAX_FILES) {
    return `添付できるファイルは ${CONTACT_ATTACHMENT_MAX_FILES} 件までです。`;
  }
  let total = 0;
  for (const file of files) {
    if (resolveAttachmentType(file) === null) {
      return `「${file.name}」は添付できない形式です。PNG / JPG / PDF のみ添付できます。`;
    }
    if (file.size > CONTACT_ATTACHMENT_MAX_FILE_BYTES) {
      return `「${file.name}」のサイズが上限（${formatBytes(CONTACT_ATTACHMENT_MAX_FILE_BYTES)}）を超えています。`;
    }
    total += file.size;
  }
  if (total > CONTACT_ATTACHMENT_MAX_TOTAL_BYTES) {
    return `添付ファイルの合計サイズは ${formatBytes(CONTACT_ATTACHMENT_MAX_TOTAL_BYTES)} までです。`;
  }
  return null;
}

/** 表示用のサイズ表記（例: 1.2 MB / 340 KB） */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
