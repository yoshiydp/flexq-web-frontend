import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import ColumnRow from "@/components/ui/ColumnRow";
import { getAllColumnItems } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "COLUMN | FlexQ",
  description: "書くことをめぐる読みもの。FlexQ のコラム一覧です。",
};

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
