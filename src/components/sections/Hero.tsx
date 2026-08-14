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
      className="relative h-[clamp(480px,75vh,760px)] w-full overflow-hidden bg-[#2E1245]"
    >
      <GlitchCanvasLoader />

      {/* Text overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <h1>
          <FlexQLogo className="h-28 w-auto text-primary drop-shadow-[0_0_24px_rgba(255,215,0,0.6)] md:h-48" />
        </h1>
        <p className="mt-12 font-mono text-sm tracking-[0.5em] text-secondary-foreground uppercase md:mt-16">
          {tagline}
        </p>
      </div>

      {/* Statement への接続フェード */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[280px] bg-[linear-gradient(to_bottom,rgba(13,6,26,0)_0%,rgba(19,7,34,.85)_70%,#130722_100%)]" />

      {/* スクロールインジケーター */}
      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-[.4em] text-muted-foreground">
          SCROLL
        </span>
        <span className="block h-10 w-px bg-[linear-gradient(#FFD700,transparent)]" />
      </div>
    </section>
  );
}
