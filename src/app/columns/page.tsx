import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import ColumnRow from "@/components/ui/ColumnRow";
import { getAllColumnItems } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const items = await getAllColumnItems();
  return pageMetadata({
    title: "COLUMN",
    description:
      "書くことをめぐる読みもの。FlexQ のコラム一覧です。",
    path: "/columns",
    // 記事がない間は空のページなので検索結果に出さない（sitemap からも外している）
    noindex: items.length === 0,
  });
}

export default async function ColumnsIndexPage() {
  const columns = await getAllColumnItems();

  return (
    <SubPageShell title="COLUMN">
      {columns.length > 0 ? (
        <div className="flex max-w-[760px] flex-col">
          {columns.map((column) => (
            <ColumnRow key={column.id} column={column} />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-[1.9] text-muted-foreground">
          まだコラムはありません。
        </p>
      )}
    </SubPageShell>
  );
}
