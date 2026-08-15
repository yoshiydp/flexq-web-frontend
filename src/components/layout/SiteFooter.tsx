import Link from "next/link";
import FlexQLogo from "@/components/FlexQLogo";
import { LEGAL_LINKS, type NavLink } from "@/components/layout/navLinks";

type Props = {
  /** 表示するナビリンク（CMS が空のセクションは呼び出し側で除外済み） */
  links: readonly NavLink[];
};

export default function SiteFooter({ links }: Props) {
  return (
    <footer className="border-t border-primary/15 bg-purple-deep px-[clamp(20px,5vw,48px)] py-12">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <FlexQLogo className="h-8 w-auto text-primary" />
          <nav className="flex flex-wrap gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] tracking-[.25em] text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-primary/10 pt-6">
          <nav className="flex flex-wrap gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] tracking-[.25em] text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} FlexQ
          </span>
        </div>
      </div>
    </footer>
  );
}
