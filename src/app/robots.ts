import type { MetadataRoute } from "next";
import { IS_INDEXABLE, SITE_URL } from "@/lib/site";

/**
 * /robots.txt を生成する。
 * 一般公開前は全クローラーを拒否し、meta robots の noindex と二重で塞ぐ
 * （meta は HTML を読んでもらえないと効かないため、robots.txt と併用する）。
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    host: SITE_URL,
  };
}
