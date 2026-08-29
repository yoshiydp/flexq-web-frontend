import Link from "next/link";

export type LegalSection = {
  /** 条項見出し（例: 第1条（収集する情報）） */
  title: string;
  /** 見出し直下の段落 */
  paragraphs?: string[];
  /** 箇条書き項目（段落の後に表示） */
  items?: string[];
  /** 箇条書きの後に続く段落 */
  notes?: string[];
  /** 連絡先メールアドレス（mailto リンクとして表示） */
  email?: string;
};

type Props = {
  /** 前文 */
  lead: string;
  sections: LegalSection[];
  /** 制定日（例: 2026年8月15日） */
  enactedDate: string;
};

const PARAGRAPH_CLASS = "text-[15px] leading-[2] text-secondary-foreground";

/**
 * プライバシーポリシー・利用規約など法的文書の共通レイアウト。
 * 記事詳細（ArticleBody）と同じタイポグラフィに揃える。
 */
export default function LegalDocument({ lead, sections, enactedDate }: Props) {
  return (
    <article className="flex flex-col gap-10">
      <p className={PARAGRAPH_CLASS}>{lead}</p>

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold leading-[1.6] text-foreground">
            {section.title}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className={PARAGRAPH_CLASS}>
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[2] text-secondary-foreground marker:text-primary/60">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.notes?.map((note) => (
            <p key={note} className={PARAGRAPH_CLASS}>
              {note}
            </p>
          ))}
          {section.email && (
            <p className={PARAGRAPH_CLASS}>
              <a
                href={`mailto:${section.email}`}
                className="text-primary underline underline-offset-4"
              >
                {section.email}
              </a>
            </p>
          )}
        </section>
      ))}

      <p className="font-mono text-[11px] tracking-[.2em] text-muted-foreground">
        制定日: {enactedDate}
      </p>

      <footer className="border-t border-border pt-8">
        <Link
          href="/"
          className="link-underline font-mono text-xs tracking-[.25em] text-secondary-foreground transition-colors hover:text-primary"
        >
          ← トップへ戻る
        </Link>
      </footer>
    </article>
  );
}
