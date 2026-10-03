/**
 * サイト内ルートの一元管理。
 * 記事一覧・詳細ページは未実装のため、実装時はここのパスを差し替えるだけで
 * 全セクションのリンクが追従する。
 */
export const routes = {
  news: "/news",
  newsArticle: (slug: string) => `/news/${slug}`,
  tutorials: "/tutorials",
  tutorial: (slug: string) => `/tutorials/${slug}`,
  columns: "/columns",
  column: (slug: string) => `/columns/${slug}`,
  privacyPolicy: "/privacy-policy",
  terms: "/terms",
  contact: "/contact",
} as const;
