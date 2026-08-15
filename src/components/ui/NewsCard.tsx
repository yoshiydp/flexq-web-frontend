import Link from "next/link";
import type { NewsItem } from "@/types/content";

/** News の記事カード（トップページ News セクション / /news 一覧で共用）。 */
export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card no-underline transition-colors hover:border-primary"
    >
      <div className="aspect-video bg-muted">
        {item.thumbnailUrl && (
          // CMS（Strapi）から供給されるサムネイル
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-3.5 px-[26px] pt-[26px] pb-[30px]">
        <div className="flex items-center gap-3.5">
          {item.category && (
            <span className="rounded-full border border-primary/40 px-3 py-1 font-mono text-[10px] tracking-[.2em] text-primary">
              {item.category}
            </span>
          )}
          <time className="font-mono text-[11px] text-muted-foreground">
            {item.date}
          </time>
        </div>
        <h4 className="text-[17px] font-semibold leading-relaxed text-foreground">
          {item.title}
        </h4>
        {item.excerpt && (
          <p className="text-[13.5px] leading-[1.8] text-[#999999]">
            {item.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
