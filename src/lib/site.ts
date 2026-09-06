/**
 * サイト全体で使う定数の一元管理。
 * URL・連絡先・検索エンジンへの露出可否をここ 1 箇所に集約し、
 * metadata / robots.txt / 構造化データ / 法務ページがすべて同じ値を参照するようにする。
 */

/**
 * サイトの正規 URL（末尾スラッシュなし）。
 * canonical / OG / 構造化データの絶対 URL の基準になる。
 *
 * Production では Vercel の環境変数 `NEXT_PUBLIC_SITE_URL` が同じ値を指す。
 * 既定値を独自ドメインにしてあるのは、環境変数が未設定の Preview / ローカルでも
 * 正しいドメインで組み立てるため（Preview は noindex なので実害はないが、
 * 目視確認時に旧ドメインが出て混乱するのを避ける）。
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://flexqstudio.com"
).replace(/\/+$/, "");

export const SITE_NAME = "FlexQ";

/** トップページのタイトル。サブページは `%s | FlexQ` のテンプレートで組み立てる */
export const SITE_TITLE = "FlexQ — YOUR MUSIC. YOUR WORDS.";

/** 検索結果・SNS カードに出る説明文。全角 100 字前後で切れないよう収めている */
export const SITE_DESCRIPTION =
  "FlexQは、シンガー・ラッパー・クリエイターのための音楽制作サポートアプリです。音源の好きな位置を何度でも再生できるCUE機能と、その場で歌を録音できるREC機能で、作詞からデモ制作までをスマホひとつで完結できます。";

/** お問い合わせ先。法務ページと構造化データの両方から参照する */
export const CONTACT_EMAIL = "contact@flexqstudio.com";

/** OG 画像（1200x630）。SITE_URL からの相対パスで metadata に渡す */
export const OG_IMAGE_PATH = "/og.png";

/**
 * 一般公開したら true にする。
 *
 * Preview デプロイ（feature ブランチ・staging）が検索結果に出てしまうと
 * 本番と重複してしまうため、公開後も Production 以外は常に noindex のままにする。
 * ローカル開発では VERCEL_ENV が未定義なので、こちらも noindex になる。
 */
const ALLOW_INDEXING = false;

export const IS_INDEXABLE =
  ALLOW_INDEXING && process.env.VERCEL_ENV === "production";

/** SITE_URL 起点の絶対 URL を作る（構造化データ用。metadata は metadataBase が解決する） */
export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
