"use client";

import Link from "next/link";
import { useState } from "react";
import FlexQLogo from "@/components/FlexQLogo";
import { DOWNLOAD_ANCHOR, type NavLink } from "@/components/layout/navLinks";
import StoreLinks from "@/components/ui/StoreLinks";
import { cn } from "@/lib/utils";

type Props = {
  /** 表示するナビリンク（CMS が空のセクションは呼び出し側で除外済み） */
  links: readonly NavLink[];
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
};

/**
 * ヒーローに重なる絶対配置ヘッダー。
 * 768px 以上: テキストリンク + DOWNLOAD ピル / 768px 未満: DOWNLOAD ピル + ハンバーガー。
 * SP メニューは常時マウントの全画面オーバーレイをフェードのみで開閉する
 * （スライドは不可・PC 幅への復帰時は md:hidden で自動的に非表示になる）。
 */
export default function SiteHeader({ links, appStoreUrl, googlePlayUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-y-3 px-[clamp(20px,4vw,48px)] py-5">
        <Link href="/" aria-label="FlexQ" onClick={closeMenu}>
          <FlexQLogo className="h-10 w-auto text-primary drop-shadow-[0_0_16px_rgba(255,215,0,.4)]" />
        </Link>

        {/* PC ナビ */}
        <nav className="hidden flex-wrap items-center gap-x-[clamp(16px,2.5vw,36px)] gap-y-3 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href={DOWNLOAD_ANCHOR}
            className="rounded-full bg-primary px-[22px] py-2.5 font-mono text-xs font-medium tracking-[.2em] text-primary-foreground transition-colors hover:bg-[#FFE44D]"
          >
            DOWNLOAD
          </a>
        </nav>

        {/* SP: DOWNLOAD ピル + ハンバーガー */}
        <div className="flex items-center gap-3 md:hidden">
          <a
            href={DOWNLOAD_ANCHOR}
            className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-[18px] py-3 font-mono text-[11px] font-medium tracking-[.2em] text-primary-foreground transition-colors hover:bg-[#FFE44D]"
          >
            DOWNLOAD
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            className="flex size-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-border bg-background/55 transition-colors hover:border-primary"
          >
            <span className="block h-[1.5px] w-[18px] bg-primary" />
            <span className="block h-[1.5px] w-[18px] bg-primary" />
            <span className="block h-[1.5px] w-[18px] bg-primary" />
          </button>
        </div>
      </header>

      {/* SP メニュー: 全画面オーバーレイ（常時マウント・フェードのみ） */}
      <div
        data-testid="mobile-menu"
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-100 flex flex-col bg-[linear-gradient(to_bottom,rgba(19,7,34,.98),rgba(13,13,13,.98))] px-6 pb-8 pt-5 transition-[opacity,visibility] duration-350 ease-out md:hidden",
          menuOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0",
        )}
      >
        <div className="flex items-center justify-between">
          <FlexQLogo className="h-9 w-auto text-primary drop-shadow-[0_0_16px_rgba(255,215,0,.4)]" />
          <button
            type="button"
            onClick={closeMenu}
            aria-label="メニューを閉じる"
            className="flex size-11 items-center justify-center rounded-lg border border-border text-xl leading-none text-primary transition-colors hover:border-primary"
          >
            ×
          </button>
        </div>
        <nav className="mt-10 flex flex-col">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="border-b border-[#262626] px-1 py-[18px] font-mono text-base tracking-[.3em] text-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto" onClick={closeMenu}>
          <StoreLinks
            appStoreUrl={appStoreUrl}
            googlePlayUrl={googlePlayUrl}
            variant="mixed"
            stacked
          />
        </div>
      </div>
    </>
  );
}
