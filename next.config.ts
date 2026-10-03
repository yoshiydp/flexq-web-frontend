import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  experimental: {
    serverActions: {
      // お問い合わせフォームの添付ファイル（合計 4MB。src/lib/contact.ts の上限と対）。
      // Vercel の関数はリクエスト本文 4.5MB が上限のため、これ以上は増やせない
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
