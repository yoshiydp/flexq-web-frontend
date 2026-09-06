import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { DOWNLOAD_ANCHOR } from "@/components/layout/navLinks";
import { AppleIcon, GooglePlayIcon } from "@/components/ui/StoreIcons";
import { cn } from "@/lib/utils";

const storeButton = cva(
  "group btn-sheen inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-[15px] font-semibold tracking-[.05em] no-underline transition-[background-color,box-shadow,transform,translate,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0",
  {
    variants: {
      variant: {
        gold: "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(255,215,0,.3)] hover:bg-[#FFE44D] hover:shadow-[0_0_48px_rgba(255,215,0,.55)] active:shadow-[0_0_24px_rgba(255,215,0,.4)]",
        outline:
          "border border-primary bg-transparent text-primary [--sheen-color:rgba(255,215,0,.28)] hover:bg-primary/10 hover:shadow-[0_0_32px_rgba(255,215,0,.22)]",
      },
      size: {
        // SP では縦積み full width、sm 以上で min-width 260px の横並びに切り替わる
        default: "w-full px-6 py-4 sm:w-auto sm:min-w-[260px] sm:px-9",
        full: "w-full px-6 py-[18px]",
      },
    },
    defaultVariants: { variant: "gold", size: "default" },
  },
);

type StoreButtonProps = {
  /** プラットフォームのブランドアイコン。色はラベルと揃える（currentColor） */
  icon: ReactNode;
  store: string;
  href: string | null;
  variant: "gold" | "outline";
  size?: "default" | "full";
};

function StoreButton({ icon, store, href, variant, size }: StoreButtonProps) {
  // CMS の未入力は "" で届くことがあるため、空白のみの値もフォールバック扱いにする
  const resolvedHref = href?.trim() ? href : null;
  return (
    <a
      href={resolvedHref ?? DOWNLOAD_ANCHOR}
      {...(resolvedHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={storeButton({ variant, size })}
    >
      {icon}
      {store}
    </a>
  );
}

type Props = {
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  /**
   * gold: 両方ゴールド塗り（CTA 既定）/ outline: 両方アウトライン /
   * mixed: App Store = gold, Google Play = outline（SP メニュー用）
   */
  variant?: "gold" | "outline" | "mixed";
  /** SP メニュー・CTA の SP 表示用: 縦積み full width */
  stacked?: boolean;
  className?: string;
};

/**
 * App Store / Google Play のストアボタンペア。
 * ラベル（App Store / Google Play）とアイコンは固定実装、URL は CMS から供給。
 */
export default function StoreLinks({
  appStoreUrl,
  googlePlayUrl,
  variant = "gold",
  stacked = false,
  className,
}: Props) {
  const appStoreVariant = variant === "outline" ? "outline" : "gold";
  const googlePlayVariant = variant === "gold" ? "gold" : "outline";
  const size = stacked ? "full" : "default";

  return (
    <div
      className={cn(
        stacked
          ? "flex w-full flex-col gap-3"
          : "flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:gap-y-4",
        className,
      )}
    >
      <StoreButton
        icon={<AppleIcon className="size-[18px] -translate-y-px" />}
        store="App Store"
        href={appStoreUrl}
        variant={appStoreVariant}
        size={size}
      />
      <StoreButton
        icon={<GooglePlayIcon className="size-4" />}
        store="Google Play"
        href={googlePlayUrl}
        variant={googlePlayVariant}
        size={size}
      />
    </div>
  );
}
