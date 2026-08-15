import type { BlocksContent } from "@strapi/blocks-react-renderer";

/**
 * トップページのドメイン型。
 * セクションコンポーネントはこの型だけに依存し、Strapi のレスポンス形状には依存しない。
 * （CMS 値とフォールバックのマージは src/lib/content.ts が担う）
 */

export type FeatureItem = {
  label: string;
  title: string;
  description: string;
};

export type AppScreen = {
  caption: string;
  imageUrl: string | null;
  highlighted: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type CtaContent = {
  heading: string;
  lead: string;
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
};

export type TopPageContent = {
  heroTagline: string;
  statement: {
    kicker: string;
    heading: string;
    body: string;
  };
  featuresHeading: string;
  features: FeatureItem[];
  previewHeading: string;
  screens: AppScreen[];
  newsHeading: string;
  newsCount: number;
  learnHeading: string;
  tutorialSubtitle: string;
  tutorialCount: number;
  columnSubtitle: string;
  columnCount: number;
  faqHeading: string;
  faqs: FaqItem[];
  cta: CtaContent;
  seoTitle: string;
  seoDescription: string;
};

export type NewsItem = {
  id: number;
  title: string;
  category: string | null;
  /** YYYY.MM.DD 形式 */
  date: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  href: string;
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type TutorialItem = {
  id: number;
  /** ゼロ埋め 2 桁の連番表示（例: "01"） */
  order: string;
  title: string;
  difficulty: Difficulty | null;
  href: string;
};

export type ColumnItem = {
  id: number;
  /** YYYY.MM.DD 形式 */
  date: string;
  category: string | null;
  title: string;
  href: string;
};

/** 記事詳細ページ（News / Tutorial / Column 共通） */
export type ArticleDetail = {
  id: number;
  title: string;
  /** YYYY.MM.DD 形式 */
  date: string;
  category: string | null;
  excerpt: string | null;
  thumbnailUrl: string | null;
  body: BlocksContent | null;
  author: string | null;
  difficulty: Difficulty | null;
  seoTitle: string;
  seoDescription: string | null;
};
