"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** フェードアウトにかける時間（ms）。globals.css の page-fade（イン側）とは独立 */
const FADE_OUT_MS = 300;

/**
 * ページ遷移のフェードイン / フェードアウトを担うラッパー。
 * - フェードイン: template 再マウント時に CSS アニメーション（page-fade）で表現。
 *   JS 不要の純粋な CSS のため、ハイドレーション前でもコンテンツが隠れない
 * - フェードアウト: 内部リンクのクリックを横取りし、opacity を落としてから遷移する。
 *   対象は「別パスへの左クリック遷移」のみ（ページ内アンカー・外部リンク・
 *   target=_blank・download・修飾キー付き・prefers-reduced-motion は通常遷移）
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!anchor.getAttribute("href")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // 同一パス（スムーススクロールのアンカー等）はフェード対象外
      if (url.pathname === window.location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      event.preventDefault();
      setLeaving(true);
      window.setTimeout(() => {
        router.push(url.pathname + url.search + url.hash);
      }, FADE_OUT_MS);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return (
    <div
      className={cn(
        "animate-page-fade transition-opacity duration-300 ease-in motion-reduce:animate-none motion-reduce:transition-none",
        leaving && "opacity-0",
      )}
    >
      {children}
    </div>
  );
}
