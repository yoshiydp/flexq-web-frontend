import FlexQLogo from "@/components/FlexQLogo";
import GlitchCanvasLoader from "@/components/canvas/GlitchCanvasLoader";

type Props = {
  tagline: string;
};

/**
 * WebGL キービジュアル（既存実装）。
 * 下端に Statement セクションへ接続する紫グラデーションのフェードと
 * スクロールインジケーターを重ねる。
 */
export default function Hero({ tagline }: Props) {
  return (
    <section
      id="hero"
      className="relative h-dvh min-h-[480px] w-full overflow-hidden bg-[#2E1245]"
    >
      <GlitchCanvasLoader />

      {/* Text overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <h1>
          {/* SP: 画面幅の 50% で可変 / md 以上: 従来の固定高さ */}
          <FlexQLogo className="h-auto w-[50vw] text-primary drop-shadow-[0_0_24px_rgba(255,215,0,0.6)] md:h-48 md:w-auto" />
        </h1>
        {/* 字間 0.5em は em 基準のため、フォントサイズの可変に自動追従する */}
        <p className="mt-12 font-mono text-[clamp(10px,3vw,14px)] tracking-[0.5em] text-secondary-foreground uppercase md:mt-16">
          {tagline}
        </p>
      </div>

      {/* 接続フェードは廃止（シェーダー自体のビネットで Statement へ接続する） */}

      {/* スクロールインジケーター（クリックで最初のコンテンツへスムーススクロール） */}
      <a
        href="#statement"
        aria-label="コンテンツへスクロール"
        className="group absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
      >
        <span className="font-mono text-[10px] tracking-[.4em] text-muted-foreground transition-colors group-hover:text-primary">
          SCROLL
        </span>
        {/* 薄いトラックの中を光のセグメントが上→下へ流れ続ける */}
        <span className="relative block h-10 w-px overflow-hidden bg-primary/15">
          <span className="animate-scroll-flow motion-reduce:animate-none absolute top-0 left-0 h-1/2 w-full bg-[linear-gradient(to_bottom,transparent,#FFD700)]" />
        </span>
      </a>
    </section>
  );
}
