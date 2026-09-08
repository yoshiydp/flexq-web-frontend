import FlexQLogo from "@/components/FlexQLogo";
import Reveal from "@/components/ui/Reveal";
import SectionBackground from "@/components/ui/SectionBackground";
import StoreLinks from "@/components/ui/StoreLinks";
import type { CtaContent } from "@/types/content";

type Props = {
  tagline: string;
  cta: CtaContent;
};

/**
 * ダウンロード CTA。黒 → 暗紫へ回帰するグラデで
 * サイト全体の「暗紫 → 黒 → 暗紫」サンドイッチ構造を閉じる。
 */
export default function CtaSection({ tagline, cta }: Props) {
  return (
    <section
      id="download"
      className="relative overflow-hidden bg-[linear-gradient(to_bottom,#0D0D0D_0%,#1B0C2E_55%,#130722_100%)] px-[clamp(20px,5vw,48px)] py-[clamp(88px,11vw,150px)]"
    >
      <SectionBackground src="/bg-cta.png" />
      {/* 紫の radial グロー */}
      <div className="pointer-events-none absolute top-[60%] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(108,52,131,.45)_0%,rgba(108,52,131,0)_60%)]" />

      {/* ロゴ → タグライン → 見出し → 本文 → ストアボタンの順に下から上へフェードイン */}
      <Reveal className="relative flex flex-col items-center gap-9 text-center">
        <FlexQLogo className="reveal-up h-auto w-[clamp(200px,30vw,300px)] text-primary drop-shadow-[0_0_30px_rgba(255,215,0,.45)]" />
        <p className="reveal-up font-mono text-xs tracking-[.5em] text-secondary-foreground uppercase [--reveal-delay:100ms]">
          {tagline}
        </p>
        <h2 className="reveal-up mt-3 text-[clamp(26px,4vw,34px)] font-semibold text-foreground [--reveal-delay:200ms]">
          {cta.heading}
        </h2>
        <p className="reveal-up max-w-[520px] text-[15px] leading-[1.9] text-secondary-foreground [text-wrap:pretty] [--reveal-delay:300ms]">
          {cta.lead}
        </p>
        <StoreLinks
          appStoreUrl={cta.appStoreUrl}
          googlePlayUrl={cta.googlePlayUrl}
          className="reveal-up mt-2 [--reveal-delay:400ms]"
        />
      </Reveal>
    </section>
  );
}
