import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import TutorialRow from "@/components/ui/TutorialRow";
import { getAllTutorialItems } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "TUTORIAL",
  description:
    "FlexQ の使い方を、順番に学べるチュートリアル一覧です。",
  path: "/tutorials",
});

export default async function TutorialsIndexPage() {
  const tutorials = await getAllTutorialItems();

  return (
    <SubPageShell title="TUTORIAL">
      {tutorials.length > 0 ? (
        <div className="flex max-w-[760px] flex-col">
          {tutorials.map((tutorial) => (
            <TutorialRow key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-[1.9] text-muted-foreground">
          まだチュートリアルはありません。
        </p>
      )}
    </SubPageShell>
  );
}
