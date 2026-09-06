import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import LegalDocument, {
  type LegalSection,
} from "@/components/ui/LegalDocument";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "PRIVACY POLICY",
  description:
    "FlexQ のプライバシーポリシーです。収集する情報とその取り扱いについて説明します。",
  path: "/privacy-policy",
});

const LEAD =
  "FlexQ（以下「本アプリ」といいます）の運営者（以下「当方」といいます）は、本アプリをご利用になるユーザーの皆さま（以下「ユーザー」といいます）の個人情報の重要性を認識し、個人情報の保護に関する法律（個人情報保護法）その他の関係法令を遵守するとともに、本プライバシーポリシー（以下「本ポリシー」といいます）に従って個人情報を適切に取り扱います。";

const SECTIONS: LegalSection[] = [
  {
    title: "第1条（収集する情報）",
    paragraphs: ["当方は、本アプリの提供にあたり、以下の情報を収集します。"],
    items: [
      "アカウント情報: メールアドレス、ユーザー名、パスワード（パスワードはハッシュ化して保存し、平文では保存しません）",
      "プロフィール情報: ユーザーが任意で設定するプロフィール画像",
      "Google アカウントでログインする場合: Google アカウントのメールアドレスおよび基本的なプロフィール情報（email / profile。センシティブな情報へのアクセス権限は取得しません）",
      "ユーザーコンテンツ: ユーザーが本アプリ上で作成・アップロードする楽曲音源、録音データ、歌詞、メモ、プロジェクト情報",
    ],
  },
  {
    title: "第2条（利用目的）",
    paragraphs: ["当方は、収集した情報を以下の目的で利用します。"],
    items: [
      "本アプリの提供・運営および本人認証のため",
      "ユーザーコンテンツの保存・表示・再生など、本アプリの機能提供のため",
      "お問い合わせへの対応のため",
      "不正利用の防止のため",
      "本アプリの品質向上・改善のため",
    ],
  },
  {
    title: "第3条（情報の保存場所）",
    paragraphs: [
      "ユーザーの情報およびユーザーコンテンツは、Amazon Web Services（AWS）の東京リージョン（ap-northeast-1）にあるデータベースおよびストレージに保存します。",
    ],
  },
  {
    title: "第4条（録音データの AI 処理）",
    paragraphs: [
      "ユーザーが本アプリ内で AI クリーンアップ等の機能を明示的に実行した場合に限り、対象の録音データを外部の AI 処理サービス（Replicate が提供する API）に送信し、ボーカル抽出等の音声処理を行います。ユーザーの操作によらず録音データが外部の AI サービスへ送信されることはありません。",
    ],
  },
  {
    title: "第5条（第三者提供）",
    paragraphs: [
      "当方は、ユーザーの個人情報およびユーザーコンテンツを第三者に販売せず、広告目的で第三者と共有することもありません。ただし、以下の場合を除きます。",
    ],
    items: [
      "ユーザー本人の同意がある場合",
      "法令に基づく場合",
      "人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき",
    ],
  },
  {
    title: "第6条（外部サービスの利用）",
    paragraphs: [
      "当方は、本アプリの提供に必要な範囲で以下の外部サービスを利用しています。各サービスにおける情報の取り扱いは、それぞれの事業者が定めるプライバシーポリシーに従います。",
    ],
    items: [
      "Amazon Web Services（データの保存・処理）",
      "Replicate（録音データの AI 処理。第4条に定める場合のみ）",
      "Google（Google アカウントによるログイン認証）",
    ],
  },
  {
    title: "第7条（安全管理措置）",
    paragraphs: [
      "当方は、個人情報の漏えい、滅失または毀損の防止その他の安全管理のため、通信の暗号化、パスワードのハッシュ化保存、アクセス制御等の必要かつ適切な措置を講じます。",
    ],
  },
  {
    title: "第8条（アカウントの削除）",
    paragraphs: [
      "ユーザーは、本アプリ内の機能からいつでもアカウントを削除できます。アカウントを削除した場合、当方が保存するユーザーの個人情報およびユーザーコンテンツはすべて削除されます。",
    ],
  },
  {
    title: "第9条（開示・訂正・利用停止等の請求）",
    paragraphs: [
      "ユーザーは、個人情報保護法の定めに従い、当方に対して自己の個人情報の開示・訂正・追加・削除・利用停止等を請求できます。ご請求の際は、第11条のお問い合わせ先までご連絡ください。ご本人であることを確認のうえ、法令に従い速やかに対応します。",
    ],
  },
  {
    title: "第10条（本ポリシーの変更）",
    paragraphs: [
      "当方は、法令の改正やサービス内容の変更に応じて、本ポリシーを改定することがあります。重要な変更を行う場合は、本アプリ内での通知等、適切な方法でお知らせします。",
    ],
  },
  {
    title: "第11条（お問い合わせ）",
    paragraphs: [
      "本ポリシーおよび個人情報の取り扱いに関するお問い合わせは、以下の連絡先までお願いします。",
    ],
    email: CONTACT_EMAIL,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <SubPageShell title="PRIVACY POLICY" width="narrow">
      <LegalDocument
        lead={LEAD}
        sections={SECTIONS}
        enactedDate="2026年8月15日"
      />
    </SubPageShell>
  );
}
