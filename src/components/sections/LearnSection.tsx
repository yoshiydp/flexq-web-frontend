import Link from "next/link";
import ColumnRow from "@/components/ui/ColumnRow";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import TutorialRow from "@/components/ui/TutorialRow";
import { routes } from "@/lib/routes";
import type { ColumnItem, TutorialItem } from "@/types/content";

type ListHeaderProps = {
  title: string;
  subtitle: string;
  viewAllHref: string;
};

function ListHeader({ title, subtitle, viewAllHref }: ListHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="flex items-baseline gap-3.5">
        <h4 className="font-mono text-xs tracking-[.3em] text-foreground">
          {title}
        </h4>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <Link
        href={viewAllHref}
        className="whitespace-nowrap font-mono text-[11px] tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
      >
        VIEW&nbsp;ALL&nbsp;→
      </Link>
    </div>
  );
}

type Props = {
  heading: string;
  tutorialSubtitle: string;
  tutorials: TutorialItem[];
  columnSubtitle: string;
  columns: ColumnItem[];
};

/** Strapi Tutorial / Column 連携セクション。どちらも空ならセクションごと非表示。 */
export default function LearnSection({
  heading,
  tutorialSubtitle,
  tutorials,
  columnSubtitle,
  columns,
}: Props) {
  if (tutorials.length === 0 && columns.length === 0) return null;

  return (
    <section
      id="learn"
      className="relative overflow-hidden border-y border-[#1F1F1F] bg-[#111111] px-[clamp(20px,5vw,48px)] py-[clamp(72px,9vw,120px)]"
    >
      <SectionBackground src="/bg-learn.png" />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] gap-[clamp(48px,6vw,80px)]">
          {/* Tutorial（連載・難易度つき） */}
          {tutorials.length > 0 && (
            <div className="flex flex-col gap-6">
              <ListHeader
                title="TUTORIAL"
                subtitle={tutorialSubtitle}
                viewAllHref={routes.tutorials}
              />
              <div className="flex flex-col">
                {tutorials.map((tutorial) => (
                  <TutorialRow key={tutorial.id} tutorial={tutorial} />
                ))}
              </div>
            </div>
          )}

          {/* Column（読みもの） */}
          {columns.length > 0 && (
            <div className="flex flex-col gap-6">
              <ListHeader
                title="COLUMN"
                subtitle={columnSubtitle}
                viewAllHref={routes.columns}
              />
              <div className="flex flex-col">
                {columns.map((column) => (
                  <ColumnRow key={column.id} column={column} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
