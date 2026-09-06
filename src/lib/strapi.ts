/**
 * Strapi v5 REST API の薄い fetch ラッパー。
 * - ISR: revalidate 60 秒（呼び出し側で上書き可）
 * - CMS 未起動・未投入でもビルド/レンダリングが落ちないよう、失敗時は null を返す
 */

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

type StrapiListResponse<T> = {
  data: T[];
  meta?: { pagination?: { pageCount?: number } };
};
type StrapiSingleResponse<T> = { data: T | null };

export type StrapiMedia = {
  url: string;
  alternativeText?: string | null;
} | null;

async function strapiFetch<T>(
  path: string,
  { revalidate = 60 }: { revalidate?: number } = {},
): Promise<T | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api${path}`, {
      headers: {
        ...(STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
          : {}),
      },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** コレクション取得。失敗時は空配列。 */
export async function fetchCollection<T>(path: string): Promise<T[]> {
  const json = await strapiFetch<StrapiListResponse<T>>(path);
  return json?.data ?? [];
}

/** 全ページ走査時の 1 リクエストあたりの件数 */
const ALL_PAGES_PAGE_SIZE = 100;

/**
 * 暴走防止の上限（= 5,000 件）。sitemap.xml の仕様上限は 50,000 URL なので、
 * これを超える規模になったら sitemap の分割とあわせて見直す。
 */
const ALL_PAGES_MAX_REQUESTS = 50;

/**
 * コレクションを全ページ辿って取得する。失敗時はそこまでの取得ぶんを返す。
 *
 * 一覧ページ用の `fetchCollection` は表示件数で打ち切るが、sitemap は
 * 公開済み URL を 1 つでも落とすと検索エンジンに拾われないため、こちらを使う。
 * `path` にページネーションのパラメータを含めないこと（ここで付与する）。
 */
export async function fetchCollectionAllPages<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const items: T[] = [];

  for (let page = 1; page <= ALL_PAGES_MAX_REQUESTS; page += 1) {
    const json = await strapiFetch<StrapiListResponse<T>>(
      `${path}${separator}pagination[page]=${page}&pagination[pageSize]=${ALL_PAGES_PAGE_SIZE}`,
    );
    // CMS 障害時は握りつぶさず打ち切る（部分的な sitemap の方が空より害が小さい）
    if (!json) break;

    items.push(...(json.data ?? []));

    // pageCount が返らない場合は 1 ページで完結したものとみなす
    const pageCount = json.meta?.pagination?.pageCount ?? page;
    if (page >= pageCount) break;
  }

  return items;
}

/**
 * コレクション取得の厳格版。CMS 障害・非 2xx はエラーを投げる。
 * 記事詳細の slug 検索など「空 = 404 (notFound)」と解釈する呼び出しで使う。
 * 失敗を空配列に潰すと、CMS 一時障害時に実在する記事 URL まで 404 になるため。
 */
export async function fetchCollectionOrThrow<T>(path: string): Promise<T[]> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: {
      ...(STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
        : {}),
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Strapi request failed (${res.status}): ${path}`);
  }
  const json = (await res.json()) as StrapiListResponse<T>;
  return json.data ?? [];
}

/** single type 取得。失敗時・未投入時は null。 */
export async function fetchSingle<T>(path: string): Promise<T | null> {
  const json = await strapiFetch<StrapiSingleResponse<T>>(path);
  return json?.data ?? null;
}

/** Strapi の media URL（相対パス）を絶対 URL に解決する。 */
export function strapiMediaUrl(media: StrapiMedia | undefined): string | null {
  const url = media?.url;
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}
