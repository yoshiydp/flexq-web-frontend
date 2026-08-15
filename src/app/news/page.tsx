import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import NewsCard from "@/components/ui/NewsCard";
import { getAllNewsItems } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "NEWS | FlexQ",
  description: "FlexQ のリリース情報・アップデート・イベントのお知らせ一覧です。",
};

export default async function NewsIndexPage() {
  const items = await getAllNewsItems();

  return (
    <SubPageShell title="NEWS">
      {items.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-[1.9] text-muted-foreground">
          まだお知らせはありません。
        </p>
      )}
    </SubPageShell>
  );
}
