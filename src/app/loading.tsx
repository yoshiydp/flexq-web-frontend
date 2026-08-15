import WaveformLoader from "@/components/ui/WaveformLoader";

/**
 * 全ルート共通の遷移中ローディング（App Router の Suspense フォールバック）。
 * サーバーフェッチを伴う遷移（記事詳細など）で表示される。
 */
export default function Loading() {
  return <WaveformLoader />;
}
