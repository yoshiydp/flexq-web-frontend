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
        "iPhone と Android の両方に対応しています。App Store / Google Play からダウンロードできます。",
    },
    {
      question: "アカウント登録は必要ですか？",
      answer:
        "はい、必要です。受信可能なメールアドレスとパスワードでご登録いただけます。Google アカウントでの登録にも対応しています。",
    },
    {
      question: "手持ちの音源ファイルを取り込めますか？",
      answer:
        "はい。端末内の音源ファイルをプロジェクトに取り込み、再生しながらリリックを執筆できます。",
    },
    {
      question: "オフラインでも使えますか？",
      answer:
        "リリックの執筆・録音メモ・音源の再生は、オフラインでもご利用いただけます。",
    },
    {
      question: "書いたリリックを書き出せますか？",
      answer:
        "テキストとして書き出し、他のアプリへ共有できます。録音メモは音声ファイルとして書き出せます。",
    },
    {
      question: "不具合や要望はどこに連絡すればよいですか？",
      answer:
        "アプリ内のフィードバックからお送りください。いただいた内容は今後のアップデートに反映していきます。",
    },
  ],

  cta: {
    heading: "さあ、次の一節を。",
    lead: "アプリは無料でダウンロードできます。iPhone / Android のどちらでも、今すぐ書きはじめられます。",
    appStoreUrl: null,
    googlePlayUrl: null,
  },

  // metadata（layout.tsx）と同じ値を使う。CMS 未投入時に og/description が
  // ページごとに食い違わないよう、定義は src/lib/site.ts の 1 箇所に寄せている
  seoTitle: SITE_TITLE,
  seoDescription: SITE_DESCRIPTION,
};
