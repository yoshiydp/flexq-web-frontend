import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** 指定時は右端に VIEW ALL → リンクを表示 */
  viewAllHref?: string;
  /** center 指定時は見出しを中央に置き、左右に罫線を伸ばす（VIEW ALL は非表示） */
  align?: "left" | "center";
  /** lg 指定時は見出しを一回り大きく表示（md 以上 18px / SP 14px） */
  size?: "md" | "lg";
};

/**
 * セクション見出しの共通パターン:
 * mono 14px / tracking .45em / gold + 右へ伸びる 1px の罫線（テキストの上下中央に配置）。
 */
export default function SectionHeader({
  title,
  viewAllHref,
  align = "left",
  size = "md",
}: Props) {
  const centered = align === "center";

  return (
    <div className="flex items-center gap-6">
      {/* 罫線（と VIEW ALL）はテキストの上下中央に揃える */}
      {centered && <span className="block h-px flex-1 bg-border" />}
      <h3
        className={cn(
          "font-mono tracking-[.45em] text-primary",
          // lg は SP では 2 段小さく（14px）、md 以上で 18px
          size === "lg" ? "text-sm md:text-lg" : "text-sm",
          centered && "text-center",
        )}
      >
        {title}
      </h3>
      <span className="block h-px flex-1 bg-border" />
      {!centered && viewAllHref && (
        <Link
          href={viewAllHref}
          className="link-underline font-mono text-xs tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
        >
          VIEW&nbsp;ALL&nbsp;→
        </Link>
      )}
    </div>
  );
}
