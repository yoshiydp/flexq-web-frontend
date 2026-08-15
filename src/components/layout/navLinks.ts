/**
 * ヘッダー・SP メニュー・フッターで共有するナビリンク定義。
 * 記事ページなどのサブページからでもトップのセクションへ遷移できるよう
 * ルート付きアンカー（/#...）にしている。
 */

import { routes } from "@/lib/routes";

export type NavLink = { href: string; label: string };

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/#features", label: "FEATURES" },
  { href: "/#preview", label: "PREVIEW" },
  { href: "/#news", label: "NEWS" },
  { href: "/#learn", label: "LEARN" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * CMS が空のとき NewsSection / LearnSection はセクションごと非表示になるため、
 * 行き先のないアンカーをナビから除外する。
 */
export function visibleNavLinks({
  hasNews,
  hasLearn,
}: {
  hasNews: boolean;
  hasLearn: boolean;
}): NavLink[] {
  return NAV_LINKS.filter((link) => {
    if (link.href === "/#news") return hasNews;
    if (link.href === "/#learn") return hasLearn;
    return true;
  });
}

/** ダウンロード CTA セクションへのアンカー */
export const DOWNLOAD_ANCHOR = "/#download";

/**
 * フッターのみに表示する規約・ポリシーページへのリンク。
 * （Google OAuth 同意画面のブランディング設定が参照する公開 URL）
 */
export const LEGAL_LINKS: readonly NavLink[] = [
  { href: routes.privacyPolicy, label: "PRIVACY POLICY" },
  { href: routes.terms, label: "TERMS" },
];
