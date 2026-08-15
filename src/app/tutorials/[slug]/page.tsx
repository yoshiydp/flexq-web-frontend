import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPageShell from "@/components/layout/SubPageShell";
import Article from "@/components/ui/Article";
import { getTutorialArticle } from "@/lib/content";
import { routes } from "@/lib/routes";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getTutorialArticle(slug);
  if (!article) return {};
  return {
    title: `${article.seoTitle} | FlexQ`,
    description: article.seoDescription ?? undefined,
  };
}

export default async function TutorialArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getTutorialArticle(slug);
  if (!article) notFound();

  return (
    <SubPageShell title="TUTORIAL" width="narrow">
      <Article
        article={article}
        backHref={routes.tutorials}
        backLabel="TUTORIAL 一覧へ"
      />
    </SubPageShell>
  );
}
