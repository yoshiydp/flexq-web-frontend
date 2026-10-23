"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: unknown;
  /** エラー境界の中身を取り直して再描画する（Next.js 16 の error.js の props） */
  retry: () => void;
};

const BUTTON_CLASS =
  "rounded-full px-7 py-3 font-mono text-sm font-medium tracking-[.2em] transition-[background-color,border-color,color,box-shadow,transform,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0";

/**
 * ブランドスタイルのエラーページ（ルートの error boundary）。
 *
 * 記事詳細は CMS（Strapi）障害時に実在する記事まで 404 と誤判定しないよう、
 * 取得失敗をエラーとして投げる（src/lib/strapi.ts の fetchCollectionOrThrow）。
 * その受け皿がないと Next.js 既定の英語のエラー画面になるため、404 ページと同じ見た目で受ける。
 * E2E（ER-03）は data-testid="error-page" でこの画面を判定する。
 */
export default function ErrorPage({ error, retry }: Props) {
  useEffect(() => {
    // 本番ではサーバー側の詳細は伏せられ digest だけが届く（サーバーログとの照合用）
    console.error(error);
  }, [error]);

  return (
    <div
      data-testid="error-page"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-[clamp(20px,5vw,48px)] text-center"
    >
      <p className="font-mono text-sm tracking-[.45em] text-primary">ERROR</p>
      <h1 className="text-2xl font-semibold text-foreground">
        PAGE COULD NOT BE LOADED
      </h1>
      <p className="text-sm leading-[1.9] text-secondary-foreground">
        ページを表示できませんでした。時間をおいて再度お試しください。
      </p>
      <div className="mt-2 flex flex-col-reverse items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className={`${BUTTON_CLASS} border border-border text-secondary-foreground hover:border-primary hover:text-primary`}
        >
          BACK TO TOP
        </Link>
        <button
          type="button"
          onClick={() => retry()}
          className={`btn-sheen ${BUTTON_CLASS} bg-primary text-primary-foreground hover:bg-[#FFE44D] hover:shadow-[0_0_28px_rgba(255,215,0,.45)]`}
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}
