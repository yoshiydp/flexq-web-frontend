import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import LegalDocument, {
  type LegalSection,
} from "@/components/ui/LegalDocument";
import { routes } from "@/lib/routes";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

/**
 * アカウント削除の案内。Google Play のデータ セーフティで登録する
 * 「アカウント削除をリクエストする URL」のため、パスを変えないこと
 * （アプリを入れ直さなくても Web から削除を依頼できる手段が求められている）。
 */
export const metadata: Metadata = pageMetadata({
  title: "ACCOUNT DELETION",
  description:
    "FlexQ のアカウントと、アカウントに保存されたデータを削除する方法をご案内します。",
  path: routes.accountDeletion,
});

const LEAD =
  "FlexQ（以下「本アプリ」といいます）のアカウントと、アカウントに保存されたデータを削除する方法をご案内します。削除は、本アプリ内の操作か、お問い合わせフォームからのご依頼で行えます。";

const SECTIONS: LegalSection[] = [
  {
    title: "1. 本アプリから削除する",
    paragraphs: [
      "本アプリにログインした状態で、次の手順で削除できます。削除はその場で完了します。",
    ],
    items: [
      "画面下部のメニューから「PROFILE」を開く",
      "画面の下にある「DELETE ACCOUNT」をタップする",
      "確認のメッセージが 2 回表示されるので、どちらも「OK」をタップする",
    ],
    notes: ["削除が完了するとログイン画面に戻ります。"],
  },
  {
    title: "2. 本アプリを使わずに削除を依頼する",
    paragraphs: [
      "本アプリをアンインストールした場合や、ログインできない場合は、お問い合わせフォームから削除をご依頼いただけます。",
    ],
    items: [
      "お問い合わせの種類で「アカウント・データについて」を選ぶ",
      "メールアドレスには、本アプリに登録しているメールアドレスを入力する（Google アカウントや Apple でサインインで登録した場合は、そのアカウントのメールアドレス。Apple の「メールを非公開」を選んだ場合は、Apple が発行した中継用のメールアドレス）",
      "本文に「アカウントの削除を希望します」と書いて送信する",
    ],
    notes: [
      "ご本人であることを確認するため、登録しているメールアドレス宛てにご連絡することがあります。確認が取れしだい、ご依頼から 30 日以内に削除し、完了をメールでお知らせします。",
    ],
    link: { href: routes.contact, label: "お問い合わせフォームへ" },
  },
  {
    title: "3. 削除されるデータ",
    paragraphs: ["アカウントを削除すると、次のデータがすべて削除されます。"],
    items: [
      "アカウント情報（メールアドレス、ユーザー名、パスワード、Google アカウント・Apple アカウントとの連携情報）",
      "プロフィール画像",
      "取り込んだ音源ファイルとアートワーク",
      "録音データ（AI クリーンアップで作成した「声のみ」の音源や、ミックス版を含む）",
      "歌詞、メモ、プロジェクトの情報",
    ],
    notes: [
      "削除したデータは元に戻せません。同じメールアドレスで新しく登録し直すことはできますが、以前のデータは引き継がれません。",
    ],
  },
  {
    title: "4. 削除後も一定期間残るデータ",
    paragraphs: [
      "次のデータは、削除後も一定期間保持したのち、自動的に、または当方が消去します。",
    ],
    items: [
      "障害に備えたデータベースのバックアップ: 削除から最大 35 日間",
      "利用規約への違反により利用を停止したアカウントの記録: 不正な再登録を防ぐため、利用停止日から 1 年間",
    ],
  },
  {
    title: "5. お問い合わせ",
    paragraphs: [
      "アカウントの削除に関するお問い合わせは、以下の連絡先でも受け付けています。",
    ],
    email: CONTACT_EMAIL,
  },
];

export default function AccountDeletionPage() {
  return (
    <SubPageShell title="ACCOUNT DELETION" width="narrow">
      <LegalDocument
        lead={LEAD}
        sections={SECTIONS}
        enactedDate="2026年10月24日"
        dateLabel="掲載日"
      />
    </SubPageShell>
  );
}
