import type { ContactValues } from "@/lib/contact";
import {
  type ContactAttachment,
  type ContactDelivery,
  type MailTransport,
  buildOperatorMail,
  buildSenderMail,
  createMailTransport,
  resolveMailProvider,
} from "@/lib/contactMail";
import { type ContactLedger, createNotionLedger } from "@/lib/contactNotion";

/**
 * 1 件の問い合わせの配送（C 案の中核）。
 *
 *   ① Notion 台帳に 1 行追加（設定されている場合）
 *   ② 運営者宛メール（台帳 URL 付き。① が失敗していたらその旨を注記）
 *   ③ 送信者宛メール（失敗したら台帳の「控えメール未達」にチェック）
 *
 * 利用者に完了画面を出す条件は「① か ② のどちらかが成功」。
 * 両方失敗したときだけ throw して、利用者にエラーと直接連絡先を案内する。
 * Strapi など別の台帳に移す場合は ContactLedger の実装を差し替える。
 */

type Deps = {
  send: MailTransport;
  ledger: ContactLedger | null;
  now?: () => Date;
};

export async function deliverContact(
  values: ContactValues,
  attachments: ContactAttachment[],
  { send, ledger, now = () => new Date() }: Deps,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const receivedAt = now();

  // ① 台帳
  let entry: { pageId: string; url: string } | null = null;
  let ledgerError: unknown = null;
  if (ledger) {
    try {
      entry = await ledger.record(values, attachments, receivedAt);
    } catch (error) {
      ledgerError = error;
      console.error("[contact] Notion 台帳への記録に失敗しました", error);
    }
  }

  // ② 運営者宛
  const notes: string[] = [];
  if (entry) notes.push(`Notion 台帳: ${entry.url}`);
  if (ledgerError) {
    notes.push(
      "※ Notion 台帳への記録に失敗しました。このメールの内容を手動で台帳に転記してください。",
    );
  }
  let operatorError: unknown = null;
  try {
    await send(buildOperatorMail(values, attachments, env, notes));
  } catch (error) {
    operatorError = error;
    console.error("[contact] 運営者宛メールの送信に失敗しました", error);
  }

  if (operatorError && !entry) {
    // 台帳にもメールにも残っていない = 問い合わせが消えるので、利用者にエラーを返す
    throw operatorError;
  }

  // ③ 送信者宛
  try {
    await send(buildSenderMail(values, attachments));
  } catch (error) {
    console.error("[contact] 送信者宛の受付メールに失敗しました", error);
    if (entry) {
      await ledger?.markSenderMailFailed(entry.pageId).catch((e) =>
        console.error("[contact] 控えメール未達の記録に失敗しました", e),
      );
    }
  }
}

/**
 * 環境変数から組み立てた既定の配送。
 * メールのトランスポートは最初の送信時に初期化する。設定不備（プロバイダ指定の誤り・
 * API キー未設定など）による例外を deliverContact の中で受け止め、
 * 台帳への記録まで巻き添えで失敗させないため。
 */
export function getContactDelivery(): ContactDelivery {
  return (values, attachments) => {
    let transport: MailTransport | null = null;
    const send: MailTransport = async (mail) => {
      transport ??= createMailTransport(resolveMailProvider());
      await transport(mail);
    };
    return deliverContact(values, attachments, {
      send,
      ledger: createNotionLedger(),
    });
  };
}
