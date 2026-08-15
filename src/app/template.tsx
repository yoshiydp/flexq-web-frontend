import PageTransition from "@/components/layout/PageTransition";

/**
 * ページ遷移ごとに再マウントされるラッパー（App Router の template）。
 * 遷移時のフェードイン / フェードアウトは PageTransition が担う。
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
