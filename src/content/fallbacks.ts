import { routes } from "@/lib/routes";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { TopPageContent } from "@/types/content";

/**
 * トップページの静的フォールバック文言。
 * Strapi の top-page single type が未投入・取得失敗でもページが完成した状態で
 * レンダリングされるよう、全フィールドの既定値をここに一元管理する。
 * CMS 投入後は top-page の値が優先される（マージは src/lib/content.ts）。
 */
export const topPageFallback: TopPageContent = {
  heroTagline: "Your Music. Your Words.",

  statement: {
    kicker: "WRITE / RECORD / PLAY",
    heading: "一瞬で名曲を\n生み出すために",
    body: "FlexQは、シンガー・ラッパー・クリエイターのための音楽制作サポートアプリです。\n音源の好きな位置から何度でもすぐに再生できる「CUE機能」で、作詞・歌詞制作をよりスムーズに。さらに「REC機能」を使えば、思いついたフレーズや歌声をその場ですぐに録音し、簡単に共有できます。聴く、書く、録る、共有する。\nFlexQが、あなたの音楽制作をもっと自由に、もっとスピーディーにします。",
  },

  featuresHeading: "3 CORE FEATURES",
  features: [
    {
      label: "01 — CUE",
      title: "作りたい場所へ、ワンタップ。",
      description:
        "音源の好きな位置にCUEポイントを設定。Aメロ、サビなど、制作したいパートをワンタップで何度でも繰り返し再生できます。巻き戻しやシーク操作の手間をなくし、作詞やフレーズ制作に集中できる環境をつくります。",
    },
    {
      label: "02 — REC",
      title: "思いついた瞬間、そのまま録る。",
      description:
        "浮かんだメロディやフロウ、歌い回しを、その場ですぐにレコーディング。音源を聴きながらアイデアを録音できるので、スマホひとつでデモ制作までスムーズに進められます。録音したデータを共有し、メンバーやクリエイターとのやり取りもスピーディーに。",
    },
    {
      label: "03 — WRITE",
      title: "聴きながら、そのまま書く。",
      description:
        "音源を再生しながら、思いついた歌詞やアイデアをその場で書き留められます。音楽を聴く、歌詞を書く、また聴き直す。その一連の作詞フローをFlexQひとつで完結。アプリを行き来することなく、浮かんだ言葉を逃さず歌詞に落とし込めます。",
    },
  ],

  previewHeading: "APP PREVIEW",
  // 画面収録は iOS シミュレーター（iPhone 17 Pro / 402x874）で撮ったものを
  // 750x1630 に縮小して public/preview/ に置いている。撮り直しの手順は README を参照
  screens: [
    {
      caption: "PROJECT LIST",
      imageUrl: "/preview/project-list-poster.jpg",
      videoBasePath: "/preview/project-list",
      highlighted: false,
    },
    {
      caption: "PROJECT EDITOR",
      imageUrl: "/preview/project-editor-poster.jpg",
      videoBasePath: "/preview/project-editor",
      highlighted: true,
    },
    {
      caption: "TRACK LIST",
      imageUrl: "/preview/track-list-poster.jpg",
      videoBasePath: "/preview/track-list",
      highlighted: false,
    },
    {
      caption: "QUICK RECORD",
      imageUrl: "/preview/quick-record-poster.jpg",
      videoBasePath: "/preview/quick-record",
      highlighted: false,
    },
  ],

  newsHeading: "NEWS",
  newsCount: 3,

  learnHeading: "LEARN & READ",
  tutorialSubtitle: "使い方を、順番に。",
  tutorialCount: 3,
  columnSubtitle: "書くことをめぐる読みもの。",
  columnCount: 3,

  faqHeading: "FAQ",
  faqs: [
    {
      question: "FlexQ の利用は無料ですか？",
      answer: "全機能を無料でご利用いただけます。",
    },
    {
      question: "対応している OS を教えてください。",
      answer:
        "現在は iPhone に対応しており、App Store からダウンロードできます。Android 版は準備中です。",
    },
    {
      question: "アカウント登録は必要ですか？",
      answer:
        "はい、必要です。メールアドレスとパスワードでご登録いただけます。ご登録時は、メールアドレス宛てに届く認証コードを入力して確認を行います。Google アカウントでの登録や、iPhone では Apple アカウントでの登録（Apple でサインイン）にも対応しています。",
    },
    {
      question: "手持ちの音源ファイルを取り込めますか？",
      answer:
        "はい。端末内の mp3 / wav 形式の音源ファイルを取り込み、プロジェクトで再生しながらリリックを執筆できます。",
    },
    {
      question: "オフラインでも使えますか？",
      answer:
        "インターネットに接続した状態でご利用ください。リリックや録音データはクラウドに保存されるため、機種変更後や別の端末でも、同じアカウントでログインすれば引き続きご利用いただけます。",
    },
    {
      question: "書いたリリックを書き出せますか？",
      answer:
        "はい。プロジェクトや QUICK MEMO で書いたリリックは共有機能から、テキストのまま LINE やメモアプリなどへ送ったり、.txt ファイルとして書き出したりできます。",
    },
    {
      question: "録音したデータを共有できますか？",
      answer:
        "はい。録音した音声は共有機能から、メッセージアプリやクラウドストレージなどへ送ったり、ファイルとして保存したりできます。AI クリーンアップを行った録音は「声のみ」の音源も共有でき、プロジェクト内の録音であれば声とトラックを重ねたミックス版も書き出せます。",
    },
    {
      question: "AI クリーンアップとは何ですか？",
      answer:
        "録音した音声から、AI で声だけを取り出す機能です。イヤホンなしで録音してトラックの音が入ってしまったテイクも、声だけの音源にできます。元の録音はそのまま残るため、「元の録音」と「声のみ」を切り替えて聴き比べられます。",
    },
    {
      question: "アカウントを削除（退会）できますか？",
      answer:
        "はい。アプリのプロフィール画面にある「DELETE ACCOUNT」から削除できます。削除すると、リリック・録音・音源などのデータもすべて削除され、元に戻すことはできません。",
    },
    {
      question: "不具合や要望はどこに連絡すればよいですか？",
      answer:
        "当サイトのお問い合わせフォームからお送りください。いただいた内容は今後のアップデートに反映していきます。",
      link: { href: routes.contact, label: "お問い合わせフォームへ" },
    },
  ],

  cta: {
    heading: "さあ、次の一節を。",
    // 改行は CtaSection の whitespace-pre-line で表示する
    lead: "アプリは無料でダウンロードできます。\niPhone で、今すぐ書きはじめられます。\nAndroid 版は準備中です。",
    appStoreUrl: null,
    googlePlayUrl: null,
  },

  // metadata（layout.tsx）と同じ値を使う。CMS 未投入時に og/description が
  // ページごとに食い違わないよう、定義は src/lib/site.ts の 1 箇所に寄せている
  seoTitle: SITE_TITLE,
  seoDescription: SITE_DESCRIPTION,
};
