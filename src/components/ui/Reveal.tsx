"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** 画面下端からこの割合（ビューポート高さ比）だけ入ったところで発火させる */
const REVEAL_OFFSET_RATIO = 0.15;

type Props = {
  /** ラッパーの要素種別 */
  as?: "div" | "span" | "figure" | "li";
  className?: string;
  /** アニメーション開始までの遅延（ms）。カードの段差表示などに使う */
  delay?: number;
  children: React.ReactNode;
};

/**
 * スクロールで画面内に入ったら一度だけ `is-revealed` クラスを付けるトリガー。
 *
 * 動きそのものは globals.css の `reveal-up`（下 → 上へフェード）/
 * `reveal-line`（罫線が 0 → 100% に伸びる）が担う。
 * このラッパー自身に付けても、子孫要素に付けてもよい
 * （子孫に付ける場合は同じトリガーで一斉に始まり、`[--reveal-delay:…]` で段差を付ける）。
 *
 * IntersectionObserver が無い環境（jsdom など）では即時に表示する。
 * リロード時に既にスクロール済みで画面より上にある要素も即時に表示する。
 */
export default function Reveal({
  as = "div",
  className,
  delay = 0,
  children,
}: Props) {
  // 要素種別ごとに ref の型が分かれてしまうため、型上は div として扱う
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  // "focus" はキーボード操作で子孫にフォーカスが当たった場合（トランジションなしで即時表示）
  const [revealed, setRevealed] = useState<false | "scroll" | "focus">(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;
    if (typeof IntersectionObserver === "undefined") {
      // 監視できないので次のティックで表示する（effect 内の同期 setState を避ける）
      const id = window.setTimeout(() => setRevealed("scroll"), 0);
      return () => window.clearTimeout(id);
    }

    let observer: IntersectionObserver | null = null;
    const stop = () => {
      observer?.disconnect();
      observer = null;
      window.removeEventListener("resize", observe);
    };
    // 要素の上端が画面下端から 15% 入ったところで発火させる。
    // rootMargin の % はビューポートの「幅」基準で解決されるため、高さから px で計算し、
    // リサイズ時に作り直す
    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            setRevealed("scroll");
            stop();
          }
        },
        {
          rootMargin: `0px 0px -${Math.round(window.innerHeight * REVEAL_OFFSET_RATIO)}px 0px`,
          threshold: 0,
        },
      );
      observer.observe(el);
    };
    observe();
    window.addEventListener("resize", observe);
    return stop;
  }, [revealed]);

  return (
    <Tag
      ref={ref}
      className={cn(
        "reveal",
        revealed && "is-revealed",
        // 子孫の [--reveal-delay:…] や 0.9s のトランジションごと無効化して即時表示する
        revealed === "focus" && "is-revealed-instant",
        className,
      )}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      data-revealed={revealed ? "" : undefined}
      // 画面下端の発火帯より下にある要素へ Tab でフォーカスが当たると、
      // 透明なままフォーカスリングも見えなくなるため、フォーカスで即時に表示する。
      // スクロールで表示が始まった直後（フェード途中）のフォーカスも即時表示に切り替える
      onFocus={() => setRevealed("focus")}
    >
      {children}
    </Tag>
  );
}
