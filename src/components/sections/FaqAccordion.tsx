"use client";

import Link from "next/link";
import { useId, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/content";

type Props = {
  faqs: FaqItem[];
};

const EASE = "ease-[cubic-bezier(.22,1,.36,1)]";

/**
 * FAQ のアコーディオン。罫線で区切った全幅の行に、白抜きの大きな連番・質問・開閉アイコンを並べる。
 *
 * - スクロールで行が入ると、行頭の罫線が左から伸びて質問がフェードインする（Reveal）
 * - hover でゴールドの帯が左 → 右へ走り、連番の輪郭がゴールドになる
 * - 開くと連番がゴールドで塗りつぶされ、左端にゴールドの縦線が伸び、＋ が × に回転する
 *
 * details/summary は高さのトランジションが Safari で効かないため、button + region で組み、
 * 高さは grid-template-rows（0fr ↔ 1fr）で補間する。閉じたパネルも DOM に残すので
 * 回答は SSR の HTML に含まれ、inert でフォーカス・読み上げの対象からだけ外す。
 */
export default function FaqAccordion({ faqs }: Props) {
  const baseId = useId();
  const [openIndexes, setOpenIndexes] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <ul className="border-b border-border [--faq-num-w:clamp(60px,9vw,120px)]">
      {faqs.map((faq, index) => {
        const open = openIndexes.has(index);
        const buttonId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;
        const number = String(index + 1).padStart(2, "0");

        return (
          <Reveal
            key={faq.question}
            as="li"
            className="relative"
            delay={Math.min(index, 4) * 70}
          >
            {/* 行頭の罫線（リビールで左から伸びる） */}
            <span
              aria-hidden
              className="reveal-line absolute inset-x-0 top-0 block h-px bg-border"
            />
            {/* 開いている間だけ左端に伸びるゴールドの縦線 */}
            <span
              aria-hidden
              className={cn(
                "absolute top-0 bottom-0 left-0 w-[2px] origin-top bg-primary shadow-[0_0_18px_rgba(255,215,0,.6)] transition-transform duration-700 motion-reduce:transition-none",
                EASE,
                open ? "scale-y-100" : "scale-y-0",
              )}
            />
            {/* 開いている間の背景（左からゴールドが滲む） */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,215,0,.09),rgba(255,215,0,0)_65%)] transition-opacity duration-700",
                open ? "opacity-100" : "opacity-0",
              )}
            />

            <h4 className="reveal-up relative">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="group relative grid w-full cursor-pointer grid-cols-[var(--faq-num-w)_1fr_auto] items-center gap-x-[clamp(12px,2.5vw,32px)] overflow-hidden py-[clamp(22px,3vw,36px)] pr-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                {/* hover で左 → 右へ走るゴールドの帯 */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 origin-left scale-x-0 bg-[linear-gradient(90deg,rgba(255,215,0,0),rgba(255,215,0,.08)_60%,rgba(255,215,0,0))] transition-transform duration-700 group-hover:scale-x-100 motion-reduce:hidden",
                    EASE,
                  )}
                />

                {/* 連番は Geist Mono だと 0 がスラッシュ付きで Ø に見えるため、sans で表示する（tabular-nums は 1 に台座が付き白抜きで目立つため使わない） */}
                <span
                  aria-hidden
                  className={cn(
                    "relative pl-[clamp(10px,2vw,28px)] text-[clamp(32px,5.8vw,72px)] leading-none font-extrabold tracking-[-.04em] transition-[color,-webkit-text-stroke-color,text-shadow] duration-500",
                    open
                      ? "text-primary [-webkit-text-stroke:1px_var(--primary)] [text-shadow:0_0_28px_rgba(255,215,0,.45)]"
                      : "text-transparent [-webkit-text-stroke:1px_#5a5a5a] group-hover:[-webkit-text-stroke:1px_var(--primary)]",
                  )}
                >
                  {number}
                </span>

                <span
                  className={cn(
                    "relative text-[clamp(15px,1.9vw,21px)] leading-[1.6] font-semibold transition-colors duration-500 [text-wrap:pretty]",
                    open ? "text-primary" : "text-foreground",
                  )}
                >
                  {faq.question}
                </span>

                {/* ＋ → ×（45° 回転）。開くとゴールドの塗りに反転する */}
                <span
                  aria-hidden
                  className={cn(
                    "relative grid size-[clamp(36px,4vw,48px)] shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-500 motion-reduce:transition-none",
                    EASE,
                    open
                      ? "rotate-[135deg] border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground group-hover:border-primary group-hover:text-primary",
                  )}
                >
                  <span className="absolute h-[1.5px] w-[40%] bg-current" />
                  <span className="absolute h-[40%] w-[1.5px] bg-current" />
                </span>
              </button>
            </h4>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={cn(
                "relative grid transition-[grid-template-rows] duration-700 motion-reduce:transition-none",
                EASE,
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "grid grid-cols-[var(--faq-num-w)_1fr] items-baseline gap-x-[clamp(12px,2.5vw,32px)] pt-[clamp(12px,1.8vw,24px)] pr-[clamp(4px,6vw,72px)] pb-[clamp(40px,5vw,64px)] transition-[opacity,translate] duration-700 motion-reduce:transition-none",
                    EASE,
                    open
                      ? "translate-y-0 opacity-100 delay-150"
                      : "-translate-y-3 opacity-0",
                  )}
                >
                  {/* 連番の列の右端に寄せ、回答本文の 1 行目とベースラインを揃える */}
                  <span
                    aria-hidden
                    className="text-right font-mono text-[clamp(15px,1.9vw,21px)] font-bold tracking-[.1em] text-primary"
                  >
                    A.
                  </span>
                  <div className="flex flex-col gap-5">
                    <p className="text-[clamp(15px,1.9vw,21px)] leading-[1.9] text-secondary-foreground [text-wrap:pretty]">
                      {faq.answer}
                    </p>
                    {faq.link && (
                      <p>
                        <Link
                          href={faq.link.href}
                          className="link-underline text-sm font-medium tracking-[.08em] text-primary"
                        >
                          {faq.link.label}&nbsp;→
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </ul>
  );
}
