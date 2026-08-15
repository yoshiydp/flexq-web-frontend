import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPageShell from "@/components/layout/SubPageShell";
import Article from "@/components/ui/Article";
import { getColumnArticle } from "@/lib/content";
import { routes } from "@/lib/routes";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getColumnArticle(slug);
  if (!article) return {};
  return {
    title: `${article.seoTitle} | FlexQ`,
    description: article.seoDescription ?? undefined,
  };
}

export default async function ColumnArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getColumnArticle(slug);
  if (!article) notFound();

  return (
    <SubPageShell title="COLUMN" width="narrow">
      <Article
        article={article}
        backHref={routes.columns}
        backLabel="COLUMN 一覧へ"
      />
    </SubPageShell>
  );
}
