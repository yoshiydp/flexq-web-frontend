import Link from "next/link";
import type { ColumnItem } from "@/types/content";

/** Column の行（トップページ Learn セクション / /columns 一覧で共用）。 */
export default function ColumnRow({ column }: { column: ColumnItem }) {
  return (
    <Link
      href={column.href}
      className="grid grid-cols-[1fr_auto] items-center gap-5 rounded border-t border-border px-2 py-[22px] no-underline transition-colors hover:bg-primary/5"
    >
      <span className="flex flex-col gap-2">
        <span className="flex items-center gap-3">
          <time className="font-mono text-[11px] text-muted-foreground">
            {column.date}
          </time>
          {column.category && (
            <span className="font-mono text-[10px] uppercase tracking-[.2em] text-[#999999]">
              {column.category}
            </span>
          )}
        </span>
        <span className="text-base font-semibold leading-normal text-foreground">
          {column.title}
        </span>
      </span>
      <span className="font-mono text-sm text-muted-foreground">→</span>
    </Link>
  );
}
