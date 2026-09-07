import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import type { FeatureItem } from "@/types/content";

type Props = {
  heading: string;
  features: FeatureItem[];
};

/**
 * 見出しを読点（、）の直後で分割する。
 * SP（sm 未満）ではこの句ごとに inline-block で並べ、句の途中で改行されないようにする。
 */
function splitTitleByPunctuation(title: string): string[] {
  return title.split(/(?<=、)/).filter((chunk) => chunk.length > 0);
}

/** 実写ムービー想定の背景（暗幕オーバーレイ必須）+ 3 カラムのカードグリッド。 */
export default function Features({ heading, features }: Props) {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-features.png" darkOverlay />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} align="center" size="lg" />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7">
          {features.map((feature) => (
            <article
              key={feature.label + feature.title}
              className="flex flex-col gap-5 rounded-lg border border-border bg-card px-8 py-10 transition-[border-color,box-shadow,transform,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_36px_rgba(255,215,0,.12)] motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
            >
              <span className="font-mono text-[13px] tracking-[.3em] text-primary">
                {feature.label}
              </span>
              <h4 className="text-[22px] font-semibold text-foreground [text-wrap:wrap] sm:[text-wrap:balance]">
                {splitTitleByPunctuation(feature.title).map((chunk, index) => (
                  <span
                    key={`${feature.label}-${index}`}
                    className="inline-block sm:inline"
                  >
                    {chunk}
                  </span>
                ))}
              </h4>
              <p className="text-[14.5px] leading-[1.9] text-secondary-foreground [text-wrap:pretty]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
