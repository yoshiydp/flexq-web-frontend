"use client";

import { useRef, useState } from "react";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import type { AppScreen } from "@/types/content";

type Props = {
  heading: string;
  screens: AppScreen[];
};

/** フォンモック内のスクリーン。CMS 画像がない間はプレースホルダー面を表示する。 */
function Screen({ screen, radiusClassName }: { screen: AppScreen; radiusClassName: string }) {
  return (
    <div className={cn("size-full overflow-hidden bg-muted", radiusClassName)}>
      {screen.imageUrl && (
        // CMS（Strapi）から供給される実機スクリーンショット
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screen.imageUrl}
          alt={screen.caption}
          loading="lazy"
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

/**
 * アプリ画面プレビュー。
 * 768px 以上: 3 台横並び（ハイライト対象のみゴールド枠・中央大）。
 * 768px 未満: ピーク型カルーセル（scroll-snap + ドットインジケーター）。
 */
export default function AppPreview({ heading, screens }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const strideOf = (el: HTMLElement) =>
    Math.min(el.clientWidth * 0.72, 300) + 16;

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.max(
      0,
      Math.min(screens.length - 1, Math.round(el.scrollLeft / strideOf(el))),
    );
    if (index !== activeIndex) setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * strideOf(el), behavior: "smooth" });
  };

  return (
    <section
      id="preview"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] pt-[clamp(72px,9vw,120px)] pb-[clamp(88px,11vw,140px)]"
    >
      <SectionBackground src="/bg-preview.png" darkOverlay />
      {/* 紫のパルスグロー */}
      <div className="animate-pulse-glow pointer-events-none absolute top-[55%] left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(108,52,131,.35)_0%,rgba(108,52,131,0)_60%)]" />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} />

        {/* PC: 3 台横並び */}
        <div className="hidden flex-wrap items-end justify-center gap-[clamp(28px,4vw,56px)] md:flex">
          {screens.map((screen) => (
            <figure
              key={screen.caption}
              className={cn(
                "m-0 flex flex-col items-center gap-[18px]",
                screen.highlighted && "pb-9",
              )}
            >
              <div
                className={cn(
                  "bg-[#111111]",
                  screen.highlighted
                    ? "h-[580px] w-[280px] rounded-[42px] border border-primary p-2.5 shadow-[0_0_50px_rgba(255,215,0,.15),0_24px_70px_rgba(0,0,0,.65)]"
                    : "h-[520px] w-[250px] rounded-[38px] border border-border p-[9px] shadow-[0_20px_60px_rgba(0,0,0,.6)]",
                )}
              >
                <Screen
                  screen={screen}
                  radiusClassName={
                    screen.highlighted ? "rounded-[33px]" : "rounded-[30px]"
                  }
                />
              </div>
              <figcaption
                className={cn(
                  "font-mono text-[11px] tracking-[.3em]",
                  screen.highlighted ? "text-primary" : "text-muted-foreground",
                )}
              >
                {screen.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* SP: ピーク型カルーセル */}
        <div className="flex flex-col gap-5 md:hidden">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="scrollbar-hide flex items-center gap-4 overflow-x-auto [scroll-snap-type:x_mandatory]"
          >
            {/* 先頭・末尾のスライドも中央で止めるためのスペーサー */}
            <span className="block flex-[0_0_calc(50%-min(36vw,150px)-16px)]" />
            {screens.map((screen, index) => (
              <figure
                key={screen.caption}
                className={cn(
                  "m-0 flex flex-[0_0_min(72vw,300px)] [scroll-snap-align:center] flex-col items-center gap-4 transition-opacity duration-300",
                  index === activeIndex ? "opacity-100" : "opacity-40",
                )}
              >
                <div
                  className={cn(
                    "box-border aspect-[260/540] w-full rounded-[40px] border bg-[#111111] p-[9px] transition-[border-color,box-shadow] duration-300",
                    screen.highlighted
                      ? "border-primary shadow-[0_0_50px_rgba(255,215,0,.15),0_20px_60px_rgba(0,0,0,.6)]"
                      : "border-border shadow-[0_20px_60px_rgba(0,0,0,.6)]",
                  )}
                >
                  <Screen screen={screen} radiusClassName="rounded-[32px]" />
                </div>
                <figcaption
                  className={cn(
                    "font-mono text-[11px] tracking-[.3em] transition-colors duration-300",
                    screen.highlighted
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {screen.caption}
                </figcaption>
              </figure>
            ))}
            <span className="block flex-[0_0_calc(50%-min(36vw,150px)-16px)]" />
          </div>

          {/* ドットインジケーター */}
          <div className="flex justify-center gap-1">
            {screens.map((screen, index) => (
              <button
                key={screen.caption}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={screen.caption}
                className="flex size-7 items-center justify-center"
              >
                <span
                  className={cn(
                    "block size-2 rounded-full transition-colors duration-300",
                    index === activeIndex ? "bg-primary" : "bg-[#444444]",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
