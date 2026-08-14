/**
 * Strapi v5 REST API の薄い fetch ラッパー。
 * - ISR: revalidate 60 秒（呼び出し側で上書き可）
 * - CMS 未起動・未投入でもビルド/レンダリングが落ちないよう、失敗時は null を返す
 */

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

type StrapiListResponse<T> = { data: T[] };
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
