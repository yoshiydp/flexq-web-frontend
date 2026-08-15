import Link from "next/link";

type Props = {
  title: string;
  /** 指定時は右端に VIEW ALL → リンクを表示 */
  viewAllHref?: string;
};

/**
 * セクション見出しの共通パターン:
 * mono 14px / tracking .45em / gold + 右へ伸びる 1px の罫線。
 */
export default function SectionHeader({ title, viewAllHref }: Props) {
  return (
    <div className="flex items-baseline gap-6">
      <h3 className="font-mono text-sm tracking-[.45em] text-primary">
        {title}
      </h3>
      <span className="block h-px flex-1 bg-border" />
      {viewAllHref && (
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
