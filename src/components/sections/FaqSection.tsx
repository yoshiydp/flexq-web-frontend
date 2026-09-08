import Reveal from "@/components/ui/Reveal";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import type { FaqItem } from "@/types/content";

type Props = {
  heading: string;
  faqs: FaqItem[];
};

/** FAQ。details/summary ベースの開閉。 */
export default function FaqSection({ heading, faqs }: Props) {
  if (faqs.length === 0) return null;

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-faq.png" />

      <div className="relative mx-auto flex max-w-[840px] flex-col gap-16">
        <SectionHeader title={heading} />

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            // details は transition-colors を持つため、リビールは外側のラッパーに持たせる
            <Reveal
              key={faq.question}
              className="reveal-up"
              delay={Math.min(index, 3) * 80}
            >
              <details className="rounded-lg border border-border bg-card px-7 py-6 transition-colors open:border-primary/40">
                <summary className="cursor-pointer text-base font-medium text-foreground">
                  {faq.question}
                </summary>
                <p className="mt-4 text-sm leading-[1.9] text-secondary-foreground">
                  {faq.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
