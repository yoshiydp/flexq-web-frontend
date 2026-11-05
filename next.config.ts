import type { NextConfig } from "next";

/**
 * 正規ドメイン以外で本番と同じ内容を配信しているホスト。
 * 検索結果で重複しないよう、パスを保ったまま正規ドメインへ 308 で転送する。
 * Preview のホストは対象外（staging の確認に使う）。
 */
const NON_CANONICAL_HOSTS = [
  "www.flexqstudio.com",
  "flexq-web-frontend.vercel.app",
];

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async redirects() {
    return NON_CANONICAL_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://flexqstudio.com/:path*",
      permanent: true,
    }));
  },
  experimental: {
    serverActions: {
      // お問い合わせフォームの添付ファイル（合計 4MB。src/lib/contact.ts の上限と対）。
      // Vercel の関数はリクエスト本文 4.5MB が上限のため、これ以上は増やせない
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
