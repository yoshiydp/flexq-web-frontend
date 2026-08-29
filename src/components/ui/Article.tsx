import Link from "next/link";
import ArticleBody from "@/components/ui/ArticleBody";
import { DIFFICULTY_DISPLAY } from "@/components/ui/TutorialRow";
import type { ArticleDetail } from "@/types/content";

type Props = {
  article: ArticleDetail;
  backHref: string;
  backLabel: string;
};

/** 記事詳細の本体（News / Tutorial / Column 共通）。 */
export default function Article({ article, backHref, backLabel }: Props) {
  const difficulty = article.difficulty
    ? DIFFICULTY_DISPLAY[article.difficulty]
    : null;

  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3.5">
          {article.category && (
            <span className="rounded-full border border-primary/40 px-3 py-1 font-mono text-[10px] tracking-[.2em] text-primary">
              {article.category}
            </span>
          )}
          {article.date && (
            <time className="font-mono text-[11px] text-muted-foreground">
              {article.date}
            </time>
          )}
          {difficulty && (
            <span className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] tracking-[.3em] text-primary">
                {difficulty.dots}
              </span>
              <span className="font-mono text-[10px] tracking-[.2em] text-[#999999]">
                {difficulty.label}
              </span>
            </span>
          )}
        </div>
        <h1 className="text-[clamp(24px,3.5vw,36px)] font-semibold leading-[1.5] text-foreground [text-wrap:balance]">
          {article.title}
        </h1>
        {article.author && (
          <p className="font-mono text-[11px] tracking-[.2em] text-muted-foreground">
            by {article.author}
          </p>
        )}
      </header>

      {article.thumbnailUrl && (
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          {/* CMS（Strapi）から供給されるサムネイル */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnailUrl}
            alt=""
            className="size-full object-cover"
          />
        </div>
      )}

      {article.body && <ArticleBody content={article.body} />}

      <footer className="border-t border-border pt-8">
        <Link
          href={backHref}
          className="link-underline font-mono text-xs tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
        >
          ← {backLabel}
        </Link>
      </footer>
    </article>
  );
}
