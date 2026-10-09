import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * お問い合わせフォームのスパム対策（外部サービス不要）。
 *
 * 1. ハニーポット … 画面に見えない入力欄に値が入っていれば bot とみなす
 * 2. 最小入力時間 … フォーム表示時に発行した署名付きトークンの発行時刻から、
 *                   一定時間経たない送信は拒否する（bot は表示直後に送ってくる）
 * 3. 連投抑制     … 同一内容の送信を一定時間まとめる（インスタンス内のベストエフォート）
 *
 * いずれもサーバー側（Server Action）で判定する。クライアントの申告は信用しない。
 */

/** トークン発行（フォーム表示）から送信までに最低限必要な時間 */
export const CONTACT_MIN_FILL_MS = 3_000;

/** トークンの有効期限。開きっぱなしのタブでも困らない程度に長くしつつ、無期限の使い回しは防ぐ */
export const CONTACT_TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1_000;

/** 同一内容を「連投」とみなす時間 */
export const CONTACT_DUPLICATE_WINDOW_MS = 10 * 60 * 1_000;

/**
 * 署名用シークレット。本番では環境変数 CONTACT_FORM_SECRET を設定する。
 * 未設定でもフォームは動くが、トークンを偽造できるため最小入力時間チェックの効果が薄れる。
 */
const DEV_FALLBACK_SECRET = "flexq-contact-form-dev-secret";
let warnedMissingSecret = false;

function getSecret(): string {
  const secret = process.env.CONTACT_FORM_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      "[contact] CONTACT_FORM_SECRET が未設定です。開発用の固定値で署名しています",
    );
  }
  return DEV_FALLBACK_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** 発行時刻を HMAC で署名したトークン（`<epoch ms>.<signature>`）を作る */
export function issueContactToken(now: number = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export type ContactTokenCheck = "ok" | "invalid" | "too_fast" | "expired";

/** トークンの署名・発行時刻を検証する */
export function checkContactToken(
  token: unknown,
  now: number = Date.now(),
): ContactTokenCheck {
  if (typeof token !== "string") return "invalid";
  const [ts, signature] = token.split(".");
  if (!ts || !signature || !/^\d+$/.test(ts)) return "invalid";

  const expected = Buffer.from(sign(ts));
  const actual = Buffer.from(signature);
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return "invalid";
  }

  const elapsed = now - Number(ts);
  if (elapsed < 0 || elapsed > CONTACT_TOKEN_MAX_AGE_MS) return "expired";
  if (elapsed < CONTACT_MIN_FILL_MS) return "too_fast";
  return "ok";
}

/** ハニーポット欄に何か入っていれば bot */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * 連投判定用の内容ハッシュ（本文そのものは保持しない）。
 * 添付ファイルの名前と中身も含める。本文が同じでも添付を足した・差し替えた再送は
 * 別の問い合わせとして扱う（含めないと、修正した添付が黙って捨てられる）。
 */
export function contactFingerprint(
  subject: string,
  message: string,
  attachments: readonly { filename: string; content: Uint8Array }[] = [],
): string {
  const hash = createHash("sha256").update(`${subject}\n${message.trim()}`);
  for (const attachment of attachments) {
    hash.update(`\n--attachment:${attachment.filename}:${attachment.content.byteLength}\n`);
    hash.update(attachment.content);
  }
  return hash.digest("hex");
}

/**
 * 直近に**配送できた**送信内容を記憶して、同一内容の連投を弾く。
 * 判定（isDuplicate）と記録（remember）を分けてあるのは、配送に失敗した送信を
 * 記憶してしまうと、利用者の再送が「連投」と誤判定されて握りつぶされるため。
 * Lambda のメモリはインスタンスごとに独立しているため完全ではないが、
 * 同じインスタンスに連続して届く典型的な連投には効く。
 */
export class RecentSubmissions {
  private readonly seen = new Map<string, number>();

  constructor(private readonly windowMs: number = CONTACT_DUPLICATE_WINDOW_MS) {}

  /** 直近 windowMs 内に同じ fingerprint が配送済みなら true（記録はしない） */
  isDuplicate(fingerprint: string, now: number = Date.now()): boolean {
    this.prune(now);
    return this.seen.has(fingerprint);
  }

  /** 配送に成功した fingerprint を記録する */
  remember(fingerprint: string, now: number = Date.now()): void {
    this.prune(now);
    this.seen.set(fingerprint, now);
  }

  private prune(now: number) {
    for (const [key, at] of this.seen) {
      if (now - at > this.windowMs) this.seen.delete(key);
    }
  }
}

/**
 * 回数制限（スライディングウィンドウ）。key ごとに windowMs 内の試行を limit 回まで許可する。
 *
 * 連投判定は「同じ内容」しか止められず、本文や宛先を変えた大量送信（送信者宛の
 * 受付メールを悪用したメール爆撃・送信枠の消費）を防げないため、内容とは独立に回数で縛る。
 * メモリ上の実装なのでインスタンスをまたぐと効かない（ベストエフォート）。
 * 厳密に縛るには Vercel Firewall のレート制限か外部ストアが必要。
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** 許可するなら試行を記録して true、上限に達していれば false */
  allow(key: string, now: number = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5_000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((at) => now - at >= this.windowMs)) this.hits.delete(key);
    }
  }
}

/** 回数制限の既定値 */
export const CONTACT_RATE_LIMITS = {
  /** 同一 IP から */
  perIp: { limit: 5, windowMs: 10 * 60 * 1_000 },
  /** 同一メールアドレス（受付メールの宛先）へ */
  perRecipient: { limit: 3, windowMs: 10 * 60 * 1_000 },
  /** インスタンス全体 */
  global: { limit: 60, windowMs: 60 * 60 * 1_000 },
} as const;

/** 添付ファイルの先頭バイト（マジックナンバー）。拡張子・MIME の偽装を弾く */
const FILE_SIGNATURES: Record<string, readonly (readonly number[])[]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

/** バッファの先頭が、その MIME タイプとして期待される署名で始まっているか */
export function hasExpectedFileSignature(
  content: Uint8Array,
  contentType: string,
): boolean {
  const signatures = FILE_SIGNATURES[contentType];
  if (!signatures) return false;
  return signatures.some(
    (sig) =>
      content.byteLength >= sig.length &&
      sig.every((byte, i) => content[i] === byte),
  );
}
