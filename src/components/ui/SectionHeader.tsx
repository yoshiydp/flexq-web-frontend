import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** 指定時は右端に VIEW ALL → リンクを表示 */
  viewAllHref?: string;
  /** center 指定時は見出しを中央に置き、左右に罫線を伸ばす（VIEW ALL は非表示） */
  align?: "left" | "center";
};

/**
 * セクション見出しの共通パターン:
 * mono 14px / tracking .45em / gold + 右へ伸びる 1px の罫線。
 */
export default function SectionHeader({
  title,
  viewAllHref,
  align = "left",
}: Props) {
  const centered = align === "center";

  return (
    <div className="flex items-baseline gap-6">
      {centered && <span className="block h-px flex-1 bg-border" />}
      <h3
        className={cn(
          "font-mono text-sm tracking-[.45em] text-primary",
          centered && "text-center",
        )}
      >
        {title}
      </h3>
      <span className="block h-px flex-1 bg-border" />
      {!centered && viewAllHref && (
        <Link
          href={viewAllHref}
          className="font-mono text-xs tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
        >
          VIEW&nbsp;ALL&nbsp;→
        </Link>
      )}
    </div>
  );
}
