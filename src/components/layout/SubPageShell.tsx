import { visibleNavLinks } from "@/components/layout/navLinks";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  getColumnItems,
  getNewsItems,
  getTopPageContent,
  getTutorialItems,
} from "@/lib/content";
import { cn } from "@/lib/utils";

type Props = {
  /** セクション見出し（mono / gold / 罫線付き） */
  title: string;
  /** 記事詳細は narrow（760px）、一覧は wide（1180px） */
  width?: "wide" | "narrow";
  children: React.ReactNode;
};

/**
 * 記事一覧・詳細などサブページの共通シェル。
 * ヘッダー（絶対配置）分の上余白と、トップページと同じ見出しパターンを提供する。
 * ヘッダーのストア URL とナビリンクの表示可否は CMS から解決する
 * （fetch は revalidate 60s でキャッシュされる）。
 */
export default async function SubPageShell({
  title,
  width = "wide",
  children,
}: Props) {
  const [content, news, tutorials, columns] = await Promise.all([
    getTopPageContent(),
    getNewsItems(1),
    getTutorialItems(1),
    getColumnItems(1),
  ]);
  // トップページと同じ判定基準（記事の有無 + top-page の表示件数設定）で
  // 非表示セクションへのアンカーを除外する
  const navLinks = visibleNavLinks({
    hasNews: content.newsCount > 0 && news.length > 0,
    hasLearn:
      (content.tutorialCount > 0 && tutorials.length > 0) ||
      (content.columnCount > 0 && columns.length > 0),
  });

  return (
    <>
      <SiteHeader
        links={navLinks}
        appStoreUrl={content.cta.appStoreUrl}
        googlePlayUrl={content.cta.googlePlayUrl}
      />
      <main className="min-h-screen bg-background px-[clamp(20px,5vw,48px)] pt-[clamp(120px,15vw,168px)] pb-[clamp(72px,9vw,120px)]">
        <div
          className={cn(
            "mx-auto flex flex-col gap-12",
            width === "wide" ? "max-w-[1180px]" : "max-w-[760px]",
          )}
        >
          <SectionHeader title={title} />
          {children}
        </div>
      </main>
      <SiteFooter links={navLinks} />
    </>
  );
}
