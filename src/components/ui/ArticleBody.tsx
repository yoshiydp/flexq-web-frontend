"use client";

import {
  BlocksRenderer,
  type BlocksContent,
} from "@strapi/blocks-react-renderer";
import { strapiMediaUrl } from "@/lib/strapi";

/**
 * Strapi の blocks 型リッチテキストを描画する。
 * BlocksRenderer が React Context を使うためクライアントコンポーネントとして分離。
 */
export default function ArticleBody({ content }: { content: BlocksContent }) {
  return (
    <div className="flex flex-col gap-6 text-[15px] leading-[2] text-secondary-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <BlocksRenderer
        content={content}
        blocks={{
          // 既定の image ブロックは url をそのまま描画するため、
          // ローカルアップロード（相対 /uploads/...）を Strapi の絶対 URL に正規化する
          image: ({ image }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={strapiMediaUrl(image) ?? image.url}
              alt={image.alternativeText ?? ""}
              loading="lazy"
              className="max-w-full rounded-lg"
            />
          ),
        }}
      />
    </div>
  );
}
