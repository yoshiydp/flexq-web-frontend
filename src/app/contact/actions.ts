"use server";

import { headers } from "next/headers";
import {
  type ContactAttachmentMeta,
  resolveAttachmentType,
  validateAttachments,
  validateContact,
} from "@/lib/contact";
import {
  CONTACT_RATE_LIMITS,
  RateLimiter,
  RecentSubmissions,
  checkContactToken,
  contactFingerprint,
  hasExpectedFileSignature,
  isHoneypotFilled,
  issueContactToken as issueToken,
} from "@/lib/contactGuard";
import { getContactDelivery } from "@/lib/contactDelivery";
import type { ContactAttachment } from "@/lib/contactMail";

export type SendContactResult =
  | { ok: true }
  | { ok: false; error: string };

const RELOAD_ERROR =
  "フォームの有効期限が切れました。ページを再読み込みしてから、もう一度お送りください。";
const TOO_FAST_ERROR =
  "送信が早すぎます。内容をご確認のうえ、もう一度「送信する」を押してください。";
const SEND_ERROR =
  "送信に失敗しました。時間をおいて再度お試しいただくか、メールで直接お問い合わせください。";

const RATE_LIMIT_ERROR =
  "短時間に送信が集中しています。しばらく時間をおいてから、もう一度お試しください。";

/** インスタンス内で直近の送信内容を記憶する（連投抑制） */
const recentSubmissions = new RecentSubmissions();
/** 配送中の送信（同じ内容が同時に届いたら 1 回の配送にまとめる） */
const inFlight = new Map<string, Promise<SendContactResult>>();
/** 回数制限（内容に関係なく、送信元・宛先・全体で縛る） */
const ipLimiter = new RateLimiter(
  CONTACT_RATE_LIMITS.perIp.limit,
  CONTACT_RATE_LIMITS.perIp.windowMs,
);
const recipientLimiter = new RateLimiter(
  CONTACT_RATE_LIMITS.perRecipient.limit,
  CONTACT_RATE_LIMITS.perRecipient.windowMs,
);
const globalLimiter = new RateLimiter(
  CONTACT_RATE_LIMITS.global.limit,
  CONTACT_RATE_LIMITS.global.windowMs,
);

/** 送信元 IP。Vercel は x-forwarded-for の先頭に実クライアントを入れる */
async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** フォーム表示時に呼び、送信時に添える署名付きトークンを発行する */
export async function issueContactToken(): Promise<string> {
  return issueToken();
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * お問い合わせ送信の Server Action。
 * 添付ファイルを含むため FormData で受け取る（フィールド名はフォーム側と対）:
 *   subject / email / message / token / website / attachments（複数可）
 * クライアント側の判定を信用せず、サーバーでも同じルールで再検証してから送信する。
 */
export async function sendContact(
  formData: FormData,
): Promise<SendContactResult> {
  const validation = validateContact({
    subject: field(formData, "subject"),
    email: field(formData, "email"),
    message: field(formData, "message"),
  });
  if (!validation.ok) {
    return { ok: false, error: Object.values(validation.errors).join(" ") };
  }

  // bot にはエラーを返さず成功したように見せる（対策の存在を悟らせない）
  if (isHoneypotFilled(field(formData, "website"))) {
    console.info("[contact] ハニーポットに入力があったため破棄しました");
    return { ok: true };
  }

  const tokenCheck = checkContactToken(field(formData, "token"));
  if (tokenCheck === "too_fast") return { ok: false, error: TOO_FAST_ERROR };
  if (tokenCheck !== "ok") return { ok: false, error: RELOAD_ERROR };

  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const metas: ContactAttachmentMeta[] = files.map((f) => ({
    name: f.name,
    type: f.type,
    size: f.size,
  }));
  const attachmentError = validateAttachments(metas);
  if (attachmentError) return { ok: false, error: attachmentError };

  const attachments: ContactAttachment[] = [];
  for (const file of files) {
    const type = resolveAttachmentType(file);
    if (!type) return { ok: false, error: "添付できない形式のファイルです。" };
    const content = Buffer.from(await file.arrayBuffer());
    // 拡張子・MIME だけでなく先頭バイトも確認する（偽装ファイルの転送を防ぐ）
    if (!hasExpectedFileSignature(content, type)) {
      return {
        ok: false,
        error: `「${file.name}」の内容がファイル形式と一致しません。PNG / JPG / PDF のみ添付できます。`,
      };
    }
    attachments.push({ filename: file.name, contentType: type, content });
  }

  // 以降の「重複判定 → 配送中の確認 → 登録」は await を挟まず一気に行う。
  // 間に await があると、同時に届いた同一内容が両方とも判定を通過して二重に配送される。
  // 非同期の IP 取得はそのため先に済ませておく
  const ip = await clientIp();

  const { subject, email, message } = validation.values;
  const fingerprint = contactFingerprint(subject, `${email}\n${message}`, attachments);
  if (recentSubmissions.isDuplicate(fingerprint)) {
    console.info("[contact] 直近と同一内容のため送信をスキップしました");
    return { ok: true };
  }

  // 同じ内容が配送中なら、その結果を共有する（再送ボタンの連打・通信断後の再試行で二重に配送しない）
  const pending = inFlight.get(fingerprint);
  if (pending) return pending;

  // 回数制限。宛先 → 送信元 → 全体の順に見る（先に弾かれたものは後段の枠を消費しない）
  if (
    !recipientLimiter.allow(email.toLowerCase()) ||
    !ipLimiter.allow(ip) ||
    !globalLimiter.allow("all")
  ) {
    console.warn("[contact] 回数制限により送信を拒否しました");
    return { ok: false, error: RATE_LIMIT_ERROR };
  }

  const delivery = (async (): Promise<SendContactResult> => {
    try {
      await getContactDelivery()(validation.values, attachments);
      // 配送できたものだけ記憶する（失敗した送信の再送を連投扱いにしないため）
      recentSubmissions.remember(fingerprint);
      return { ok: true };
    } catch (error) {
      console.error("[contact] 送信に失敗しました", error);
      return { ok: false, error: SEND_ERROR };
    } finally {
      inFlight.delete(fingerprint);
    }
  })();
  inFlight.set(fingerprint, delivery);
  return delivery;
}
