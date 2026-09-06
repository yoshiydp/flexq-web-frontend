import { DOWNLOAD_ANCHOR } from "@/components/layout/navLinks";
import { cn } from "@/lib/utils";

/**
 * ストアバッジの寸法（px）。
 *
 * Apple の SVG はバッジがそのまま画像の端まで描かれているが、Google Play の PNG は
 * 規定のクリアスペースを内側に含んでおり、実際のバッジは画像高さの 76.8% しかない
 * （646x250 の画像に対し、バッジ本体は 646x192）。同じ height を与えると Google の方が
 * 一回り小さく見えるため、見た目の高さが揃うよう画像側の高さを割り戻している。
 *
 * バッジ画像そのものは加工しない（改変・切り抜きは両社のガイドラインで禁止されている）。
 */
const BADGE_HEIGHT = 46;
const GOOGLE_BADGE_VISIBLE_RATIO = 192 / 250;

const badgeLink =
  "inline-flex shrink-0 items-center justify-center rounded-lg no-underline transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

type Props = {
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  /** SP メニュー・CTA の SP 表示用: 縦積み中央寄せ */
  stacked?: boolean;
  className?: string;
};

type BadgeLinkProps = {
  href: string | null;
  children: React.ReactNode;
};

function BadgeLink({ href, children }: BadgeLinkProps) {
  // CMS の未入力は "" で届くことがあるため、空白のみの値もフォールバック扱いにする
  const resolvedHref = href?.trim() ? href : null;
  return (
    <a
      href={resolvedHref ?? DOWNLOAD_ANCHOR}
      {...(resolvedHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={badgeLink}
    >
      {children}
    </a>
  );
}

/**
 * App Store / Google Play のストアバッジ。
 *
 * Apple・Google が配布している公式バッジ（日本語版）をそのまま使う。
 * URL は CMS から供給し、未設定のあいだはダウンロード CTA へアンカーする。
 * 画像は next/image を通さない（バッジは再エンコードせず配布物のまま出す）。
 */
export default function StoreLinks({
  appStoreUrl,
  googlePlayUrl,
  stacked = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-x-5 gap-y-3",
        stacked ? "w-full flex-col" : "flex-col sm:w-auto sm:flex-row sm:flex-wrap",
        className,
      )}
    >
      <BadgeLink href={appStoreUrl}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/badges/app-store-ja.svg"
          alt="App Store からダウンロード"
          width={125}
          height={BADGE_HEIGHT}
          style={{ height: BADGE_HEIGHT, width: "auto" }}
        />
      </BadgeLink>
      <BadgeLink href={googlePlayUrl}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/badges/google-play-ja.png"
          alt="Google Play で手に入れよう"
          width={155}
          height={60}
          style={{
            height: BADGE_HEIGHT / GOOGLE_BADGE_VISIBLE_RATIO,
            width: "auto",
          }}
        />
      </BadgeLink>
    </div>
  );
}
