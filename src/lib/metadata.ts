import type { Metadata } from "next";
import { OG_IMAGE_PATH, SITE_NAME } from "./site";

type PageMetadataInput = {
  /** 画面名。ルートの template によって `%s | FlexQ` になる */
  title: string;
  description?: string;
  /** サイト内の絶対パス。canonical と og:url に使う */
  path: string;
  /** 記事ページは "article"、それ以外は "website" */
  type?: "website" | "article";
};

/**
 * サブページ共通の metadata を組み立てる。
 *
 * Next.js の metadata は openGraph / twitter を**フィールド単位でマージしない**。
 * ページ側で定義しなければルート（layout.tsx）の値がそのまま使われ、
 * og:title も og:url もトップページのものになってしまう。
 * かといって毎ページに全項目を書くと必ずズレるので、その定型をここに閉じ込める。
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
}: PageMetadataInput): Metadata {
  // og:title には template が効かないため、ここでサイト名を付ける
  const ogTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "ja_JP",
      siteName: SITE_NAME,
      url: path,
      title: ogTitle,
      description,
      images: [
        { url: OG_IMAGE_PATH, width: 1200, height: 630, alt: ogTitle },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
