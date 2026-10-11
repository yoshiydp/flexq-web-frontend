import FaqAccordion from "@/components/sections/FaqAccordion";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import type { FaqItem } from "@/types/content";

type Props = {
  heading: string;
  faqs: FaqItem[];
};

/** FAQ。開閉と演出は FaqAccordion が担う。 */
export default function FaqSection({ heading, faqs }: Props) {
  if (faqs.length === 0) return null;

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-faq.png" />

      <div className="relative mx-auto flex max-w-[1080px] flex-col gap-16">
        <SectionHeader title={heading} />
        <FaqAccordion faqs={faqs} />
      </div>
    </section>
  );
}
