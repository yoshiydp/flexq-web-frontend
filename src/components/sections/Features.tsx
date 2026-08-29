import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import type { FeatureItem } from "@/types/content";

type Props = {
  heading: string;
  features: FeatureItem[];
};

/** 実写ムービー想定の背景（暗幕オーバーレイ必須）+ 3 カラムのカードグリッド。 */
export default function Features({ heading, features }: Props) {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-features.png" darkOverlay />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} align="center" />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7">
          {features.map((feature) => (
            <article
              key={feature.label + feature.title}
              className="flex flex-col gap-5 rounded-lg border border-border bg-card px-8 py-10 transition-colors hover:border-primary"
            >
              <span className="font-mono text-[13px] tracking-[.3em] text-primary">
                {feature.label}
              </span>
              <h4 className="text-[22px] font-semibold text-foreground [text-wrap:balance]">
                {feature.title}
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
