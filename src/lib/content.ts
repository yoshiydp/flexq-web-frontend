import { topPageFallback } from "@/content/fallbacks";
import { routes } from "@/lib/routes";
import {
  fetchCollection,
  fetchCollectionOrThrow,
  fetchSingle,
  strapiMediaUrl,
  type StrapiMedia,
} from "@/lib/strapi";
import type {
  ArticleDetail,
  ColumnItem,
  Difficulty,
  NewsItem,
  TopPageContent,
  TutorialItem,
} from "@/types/content";

/**
 * コンテンツ解決層。
 * Strapi のレスポンスをドメイン型へマップし、top-page はフォールバック文言とマージする。
 * セクションコンポーネントはこのモジュールの戻り値（ドメイン型）だけを受け取る。
 */

// サーバーのタイムゾーンに依存すると環境（ローカル JST / ホスティング UTC）で
// 日付表示がずれるため、日本時間に固定して整形する
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Date → YYYY.MM.DD（JST 固定） */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateFormatter.format(d).replaceAll("/", ".");
}

/** CMS 値が空文字・null のときフォールバックを使う */
function or<T>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

// ---- Strapi v5 レスポンス型（フラット構造） ----

type StrapiTopPage = {
  heroTagline?: string | null;
  statementKicker?: string | null;
  statementHeading?: string | null;
  statementBody?: string | null;
  featuresHeading?: string | null;
  features?: {
    id: number;
    label?: string | null;
    title: string;
    description?: string | null;
  }[];
  previewHeading?: string | null;
  screens?: {
    id: number;
    caption?: string | null;
    screenshot?: StrapiMedia;
    highlighted?: boolean | null;
  }[];
  newsHeading?: string | null;
  newsCount?: number | null;
  learnHeading?: string | null;
  tutorialSubtitle?: string | null;
  tutorialCount?: number | null;
  columnSubtitle?: string | null;
  columnCount?: number | null;
  faqHeading?: string | null;
  faqs?: { id: number; question: string; answer: string }[];
  cta?: {
    heading?: string | null;
    lead?: string | null;
    appStoreUrl?: string | null;
    googlePlayUrl?: string | null;
  } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type StrapiArticleBase = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: StrapiMedia;
  publishedAt?: string | null;
  category?: { name: string } | null;
  body?: ArticleDetail["body"];
  author?: { name: string } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type StrapiTutorial = StrapiArticleBase & {
  order?: number | null;
  difficulty?: Difficulty | null;
};

// ---- 取得 + マージ ----

export async function getTopPageContent(): Promise<TopPageContent> {
  const cms = await fetchSingle<StrapiTopPage>(
    "/top-page?populate[features]=*&populate[screens][populate]=screenshot&populate[faqs]=*&populate[cta]=*",
  );
  const fb = topPageFallback;
  if (!cms) return fb;

  return {
    heroTagline: or(cms.heroTagline, fb.heroTagline),
    statement: {
      kicker: or(cms.statementKicker, fb.statement.kicker),
      heading: or(cms.statementHeading, fb.statement.heading),
      body: or(cms.statementBody, fb.statement.body),
    },
    featuresHeading: or(cms.featuresHeading, fb.featuresHeading),
    features: cms.features?.length
      ? cms.features.map((f) => ({
          label: f.label ?? "",
          title: f.title,
          description: f.description ?? "",
        }))
      : fb.features,
    previewHeading: or(cms.previewHeading, fb.previewHeading),
    screens: cms.screens?.length
      ? cms.screens.map((s) => ({
          caption: s.caption ?? "",
          imageUrl: strapiMediaUrl(s.screenshot),
          // 画面収録は CMS では扱わずリポジトリ（public/preview/）で管理する
          videoBasePath: null,
          highlighted: s.highlighted ?? false,
        }))
      : fb.screens,
    newsHeading: or(cms.newsHeading, fb.newsHeading),
    newsCount: cms.newsCount ?? fb.newsCount,
    learnHeading: or(cms.learnHeading, fb.learnHeading),
    tutorialSubtitle: or(cms.tutorialSubtitle, fb.tutorialSubtitle),
    tutorialCount: cms.tutorialCount ?? fb.tutorialCount,
    columnSubtitle: or(cms.columnSubtitle, fb.columnSubtitle),
    columnCount: cms.columnCount ?? fb.columnCount,
    faqHeading: or(cms.faqHeading, fb.faqHeading),
    faqs: cms.faqs?.length
      ? cms.faqs.map((f) => ({ question: f.question, answer: f.answer }))
      : fb.faqs,
    cta: {
      heading: or(cms.cta?.heading, fb.cta.heading),
      lead: or(cms.cta?.lead, fb.cta.lead),
      // CMS の未入力（"" / 空白）は null に正規化してフォールバック挙動に乗せる
      appStoreUrl: cms.cta?.appStoreUrl?.trim() || fb.cta.appStoreUrl,
      googlePlayUrl: cms.cta?.googlePlayUrl?.trim() || fb.cta.googlePlayUrl,
    },
    seoTitle: or(cms.seoTitle, fb.seoTitle),
    seoDescription: or(cms.seoDescription, fb.seoDescription),
  };
}

export async function getNewsItems(count: number): Promise<NewsItem[]> {
  const articles = await fetchCollection<StrapiArticleBase>(
    `/news-articles?populate=*&sort=publishedAt:desc&pagination[pageSize]=${count}`,
  );
  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category?.name ?? null,
    date: formatDate(a.publishedAt),
    excerpt: a.excerpt ?? null,
    thumbnailUrl: strapiMediaUrl(a.thumbnail),
    href: routes.newsArticle(a.slug),
  }));
}

export async function getTutorialItems(count: number): Promise<TutorialItem[]> {
  const tutorials = await fetchCollection<StrapiTutorial>(
    `/tutorials?populate=*&sort=order:asc&pagination[pageSize]=${count}`,
  );
  return tutorials.map((t, i) => ({
    id: t.id,
    order: String(t.order ?? i + 1).padStart(2, "0"),
    title: t.title,
    difficulty: t.difficulty ?? null,
    href: routes.tutorial(t.slug),
  }));
}

export async function getColumnItems(count: number): Promise<ColumnItem[]> {
  const columns = await fetchCollection<StrapiArticleBase>(
    `/columns?populate=*&sort=publishedAt:desc&pagination[pageSize]=${count}`,
  );
  return columns.map((c) => ({
    id: c.id,
    date: formatDate(c.publishedAt),
    category: c.category?.name ?? null,
    title: c.title,
    href: routes.column(c.slug),
  }));
}

// ---- 記事一覧・詳細ページ用 ----

/** 一覧ページの最大表示件数（ページネーション導入までの上限） */
const LIST_PAGE_SIZE = 48;

export function getAllNewsItems(): Promise<NewsItem[]> {
  return getNewsItems(LIST_PAGE_SIZE);
}

export function getAllTutorialItems(): Promise<TutorialItem[]> {
  return getTutorialItems(LIST_PAGE_SIZE);
}

export function getAllColumnItems(): Promise<ColumnItem[]> {
  return getColumnItems(LIST_PAGE_SIZE);
}

function toArticleDetail(article: StrapiTutorial): ArticleDetail {
  return {
    id: article.id,
    title: article.title,
    date: formatDate(article.publishedAt),
    category: article.category?.name ?? null,
    excerpt: article.excerpt ?? null,
    thumbnailUrl: strapiMediaUrl(article.thumbnail),
    body: article.body ?? null,
    author: article.author?.name ?? null,
    difficulty: article.difficulty ?? null,
    seoTitle: article.seoTitle?.trim() || article.title,
    seoDescription: article.seoDescription ?? article.excerpt ?? null,
  };
}

/**
 * slug で記事詳細を取得する。null（= 記事が存在しない）は呼び出し側で notFound() に
 * 解釈されるため、CMS 障害と区別できるよう取得失敗時はエラーを投げる厳格版を使う。
 */
async function getArticleBySlug(
  collection: "news-articles" | "tutorials" | "columns",
  slug: string,
): Promise<ArticleDetail | null> {
  const matches = await fetchCollectionOrThrow<StrapiTutorial>(
    `/${collection}?populate=*&filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
  );
  const article = matches[0];
  return article ? toArticleDetail(article) : null;
}

export function getNewsArticle(slug: string): Promise<ArticleDetail | null> {
  return getArticleBySlug("news-articles", slug);
}

export function getTutorialArticle(
  slug: string,
): Promise<ArticleDetail | null> {
  return getArticleBySlug("tutorials", slug);
}

export function getColumnArticle(slug: string): Promise<ArticleDetail | null> {
  return getArticleBySlug("columns", slug);
}
