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
    heading: "書く、録る、聴く。\n制作のすべてを、この手の中に。",
    body: "FlexQ は、シンガー・ラッパー・ミュージシャンのためのリリック制作アプリ。音源を再生しながら歌詞を書き、閃いたフレーズやメロディはその場で録音してメモに残せます。",
  },

  featuresHeading: "FEATURES",
  features: [
    {
      label: "01 — WRITE",
      title: "音源と一緒に書く",
      description:
        "音源をリアルタイムで再生しながらリリックを執筆。音楽プレイヤーのように再生シーケンスを自由に行き来しながら、フロウに乗る言葉を探せます。",
    },
    {
      label: "02 — RECORD",
      title: "閃きをその場で録る",
      description:
        "思いついたフレーズやメロディをワンタップで録音し、メモとして保存。アイデアを逃さず、あとから聴き返して歌詞に落とし込めます。",
    },
    {
      label: "03 — ORGANIZE",
      title: "プロジェクトで管理",
      description:
        "トラック・リリック・録音メモを曲ごとのプロジェクトに集約。制作の断片が散らばらず、いつでも続きから始められます。",
    },
  ],

  previewHeading: "APP PREVIEW",
  screens: [
    { caption: "PROJECT LIST", imageUrl: null, highlighted: false },
    { caption: "LYRIC EDITOR", imageUrl: null, highlighted: true },
    { caption: "VOICE MEMO", imageUrl: null, highlighted: false },
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

  seoTitle: "FlexQ — YOUR MUSIC. YOUR WORDS.",
  seoDescription:
    "FlexQ は、シンガー・ラッパー・ミュージシャンのためのリリック制作アプリです。",
};
