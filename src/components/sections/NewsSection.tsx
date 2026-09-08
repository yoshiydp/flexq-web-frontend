import NewsCard from "@/components/ui/NewsCard";
import Reveal from "@/components/ui/Reveal";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import { routes } from "@/lib/routes";
import type { NewsItem } from "@/types/content";

type Props = {
  heading: string;
  items: NewsItem[];
};

/** Strapi News 連携セクション。記事が 1 件もない場合はセクションごと非表示。 */
export default function NewsSection({ heading, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section
      id="news"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-news.png" />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} viewAllHref={routes.news} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7">
          {items.map((item, index) => (
            // カードは hover で translate を使うため、リビールは外側のラッパーに持たせる
            <Reveal key={item.id} className="reveal-up grid" delay={index * 120}>
              <NewsCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
