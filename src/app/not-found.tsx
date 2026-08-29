import Link from "next/link";

/** ブランドスタイルの 404 ページ。 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-[clamp(20px,5vw,48px)] text-center">
      <p className="font-mono text-sm tracking-[.45em] text-primary">404</p>
      <h1 className="text-2xl font-semibold text-foreground">
        PAGE NOT FOUND
      </h1>
      <p className="text-sm leading-[1.9] text-secondary-foreground">
        お探しのページは見つかりませんでした。
      </p>
      <Link
        href="/"
        className="btn-sheen mt-2 rounded-full bg-primary px-7 py-3 font-mono text-sm font-medium tracking-[.2em] text-primary-foreground transition-[background-color,box-shadow,transform,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:bg-[#FFE44D] hover:shadow-[0_0_28px_rgba(255,215,0,.45)] active:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
      >
        BACK TO TOP
      </Link>
    </div>
  );
}
