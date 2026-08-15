import { WAVEFORM_PATH } from "@/components/ui/waveformPath";

/**
 * ページ遷移時のローディング表示。
 * ブランドモチーフのウェーブフォーム上をゴールドの光が走り続ける。
 */
export default function WaveformLoader() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-[clamp(20px,5vw,48px)]"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="h-16 w-full max-w-[640px]"
      >
        {/* 薄いトラック（波形全体） */}
        <path
          d={WAVEFORM_PATH}
          stroke="#FFD700"
          strokeWidth="1.5"
          fill="none"
          opacity="0.15"
        />
        {/* 波形上を走る光のセグメント */}
        <path
          d={WAVEFORM_PATH}
          pathLength={1}
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0.25 0.75"
          fill="none"
          className="animate-wave-dash motion-reduce:animate-none"
        />
      </svg>
      <span className="animate-pulse font-mono text-[10px] tracking-[.4em] text-muted-foreground">
        LOADING
      </span>
    </div>
  );
}
