import type { MetadataRoute } from "next";
import { getAllArticlePaths } from "@/lib/content";
import { routes } from "@/lib/routes";
import { absoluteUrl, IS_INDEXABLE, SITE_URL } from "@/lib/site";

/**
 * /sitemap.xml を生成する。
 *
 * 一般公開前（IS_INDEXABLE が false）は robots.txt が全 URL を拒否しているため、
 * sitemap を出しても意味がないうえ、未公開ページの一覧を晒すことになる。
 * そのため robots.ts と同じ条件で空にする。
 */

/** CMS に依存しない固定ページ */
const STATIC_PATHS = [
  "/",
  routes.news,
  routes.tutorials,
  routes.columns,
  routes.terms,
  routes.privacyPolicy,
  routes.contact,
];

// ISR: 記事の追加は最長 60 秒で sitemap に反映される（各ページと同じ間隔）
export const revalidate = 60;

/**
 * canonical は `/` を末尾スラッシュなしで出力する（metadataBase の解決結果）。
 * sitemap と食い違うと同一ページが 2 つの URL として扱われるため揃える。
 */
function toUrl(path: string): string {
  return path === "/" ? SITE_URL : absoluteUrl(path);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!IS_INDEXABLE) return [];

  // CMS 停止中・取得失敗時は空配列が返るため、その場合は固定ページだけになる
  const articlePaths = await getAllArticlePaths();

  const paths = [...STATIC_PATHS, ...articlePaths];

  // lastModified は付けない。CMS の日付は表示用に YYYY.MM.DD へ整形済みで、
  // 正確な更新日時を保持していないため、誤った値を送るより省く方がよい
  return paths.map((path) => ({ url: toUrl(path) }));
}
