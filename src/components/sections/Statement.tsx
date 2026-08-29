import SectionBackground from "@/components/ui/SectionBackground";
import { WAVEFORM_PATH } from "@/components/ui/waveformPath";
import type { TopPageContent } from "@/types/content";

type Props = {
  statement: TopPageContent["statement"];
};

/**
 * ヒーローとの接続部。紫 → 黒の縦グラデ + 上部パープルグロー +
 * 疑似色収差の見出し + 下端のウェーブフォーム SVG。
 */
export default function Statement({ statement }: Props) {
  return (
    <section
      id="statement"
      className="relative overflow-hidden bg-[linear-gradient(to_bottom,#130722_0%,#150A20_45%,#0D0D0D_100%)] px-[clamp(20px,5vw,48px)] pt-[clamp(80px,10vw,140px)] pb-[clamp(88px,11vw,150px)]"
    >
      <SectionBackground src="/bg-statement.png" imageOpacityClassName="opacity-80" />

      {/* 上部パープルグロー */}
      <div className="pointer-events-none absolute -inset-y-[20%] -inset-x-[10%] bg-[radial-gradient(circle_at_50%_0%,rgba(108,52,131,.3)_0%,rgba(108,52,131,0)_55%)]" />
      {/* 上端のゴールドヘアライン */}
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,.35),transparent)]" />

      <div className="relative mx-auto flex max-w-[920px] flex-col items-center gap-8 text-center">
        <span className="font-mono text-xs tracking-[.45em] text-primary md:text-sm">
          {statement.kicker}
        </span>
        {/*
          見出しの \n は SP 向けの折り返し位置。各行を inline-block にすることで、
          幅が足りる PC では 1 行に並び、SP では \n の位置で折り返す。
        */}
        <h2 className="text-[clamp(30px,4.5vw,56px)] font-semibold leading-[1.35] tracking-[.02em] text-foreground [text-shadow:3px_0_0_rgba(108,52,131,.55),-3px_0_0_rgba(255,215,0,.18)]">
          {statement.heading.split("\n").map((line, i) => (
            <span key={i} className="inline-block">
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-[740px] text-[17px] leading-8 text-secondary-foreground [text-wrap:pretty] whitespace-pre-line">
          {statement.body}
        </p>
      </div>

      {/* ウェーブフォーム */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="relative mt-[clamp(48px,8vw,90px)] block h-20 w-full"
      >
        <path
          d={WAVEFORM_PATH}
          stroke="#FFD700"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </section>
  );
}
