"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { STOP_INERTIA_EVENT } from "@/lib/smoothScroll";

/**
 * ページ全体のスクロールに慣性を付ける（Lenis）。
 * ルートレイアウトに 1 度だけマウントし、ページ遷移をまたいで生き続ける。
 *
 * - wheel / トラックパッドのスクロールを lerp で追従させる（タッチは OS ネイティブのまま）
 * - prefers-reduced-motion は Lenis 自身が尊重する（smoothing 無効 + scrollTo は即時ジャンプ）
 * - 同一ページ内のアンカーリンク（#features など）は既定のジャンプを止め、
 *   URL のハッシュを更新したうえで Lenis のスクロールに置き換える
 *   （Lenis の anchors オプションはハッシュを更新しないため自前で処理する）
 * - naiveDimensions: html は h-full で高さが固定されているため、ResizeObserver では
 *   FAQ の開閉やページ遷移によるコンテンツ高の変化を検知できない。
 *   毎フレーム scrollHeight から limit を求めることで下端まで確実にスクロールできるようにする
 * - stopInertiaOnNavigate + pathname 監視: 慣性が残ったまま別ページへ遷移すると、
 *   Lenis が古い目標位置へ動き続けて Next.js の先頭スクロールを上書きするため、
 *   リンククリック時とルート変更時に慣性を止める
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      naiveDimensions: true,
      stopInertiaOnNavigate: true,
    });
    lenisRef.current = lenis;

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
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !url.hash
      ) {
        return;
      }
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;

      event.preventDefault();
      if (url.hash !== window.location.hash) {
        window.history.pushState(null, "", url.hash);
      }
      lenis.scrollTo(target, {
        // 既定のアンカー遷移と同様に、到着後はフォーカス（Tab の起点）を
        // 移動先に移す。preventScroll でフォーカスによる再スクロールは起こさない
        onComplete: () => {
          if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        },
      });
    };

    // 同一ページ内の戻る / 進む（ハッシュのみの履歴移動）は pathname が変わらないため、
    // popstate で慣性を止めてブラウザの復元位置に同期させる
    const onPopState = () => stopInertia(lenis);

    // ページ遷移を伴わない画面切り替え（お問い合わせフォームのステップ移動など）が
    // プログラムからスクロールする前に、進行中の慣性を止めるための窓口
    const onStopInertia = () => stopInertia(lenis);

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(STOP_INERTIA_EVENT, onStopInertia);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(STOP_INERTIA_EVENT, onStopInertia);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // ルート変更（戻る / 進むを含む）で進行中の慣性を止め、ブラウザ側の
  // スクロール位置（先頭・復元位置）に同期させる
  useEffect(() => {
    if (lenisRef.current) stopInertia(lenisRef.current);
  }, [pathname]);

  return null;
}

/**
 * 進行中の慣性を止めて現在のスクロール位置に同期させる。
 * reset() は private のため、内部で reset() を呼ぶ stop() → start() を使う
 */
function stopInertia(lenis: Lenis) {
  lenis.stop();
  lenis.start();
}
