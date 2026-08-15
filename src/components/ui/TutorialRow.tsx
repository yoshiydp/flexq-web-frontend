import Link from "next/link";
import type { Difficulty, TutorialItem } from "@/types/content";

export const DIFFICULTY_DISPLAY: Record<
  Difficulty,
  { dots: string; label: string }
> = {
  beginner: { dots: "●○○", label: "BEGINNER" },
  intermediate: { dots: "●●○", label: "INTERMEDIATE" },
  advanced: { dots: "●●●", label: "ADVANCED" },
};

/** Tutorial の行（トップページ Learn セクション / /tutorials 一覧で共用）。 */
export default function TutorialRow({ tutorial }: { tutorial: TutorialItem }) {
  const difficulty = tutorial.difficulty
    ? DIFFICULTY_DISPLAY[tutorial.difficulty]
    : null;
  return (
    <Link
      href={tutorial.href}
      className="grid grid-cols-[52px_1fr_auto] items-center gap-5 rounded border-t border-border px-2 py-[22px] no-underline transition-colors hover:bg-primary/5"
    >
      <span className="font-mono text-[26px] font-light text-[#555555]">
        {tutorial.order}
      </span>
      <span className="flex flex-col gap-2">
        <span className="text-base font-semibold leading-normal text-foreground">
          {tutorial.title}
        </span>
        {difficulty && (
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[.3em] text-primary">
              {difficulty.dots}
            </span>
            <span className="font-mono text-[10px] tracking-[.2em] text-[#999999]">
              {difficulty.label}
            </span>
          </span>
        )}
      </span>
      <span className="font-mono text-sm text-muted-foreground">→</span>
    </Link>
  );
}
