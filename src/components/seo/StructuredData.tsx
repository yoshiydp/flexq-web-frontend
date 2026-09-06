import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site";

/**
 * トップページの構造化データ（JSON-LD）。
 *
 * 検索エンジンだけでなく、生成 AI のクローラーもここを見てサイトの素性
 * （何のサービスか・対応 OS・料金・連絡先）を把握するため、@graph に
 * Organization / WebSite / MobileApplication をまとめて 1 本で出力する。
 * @id で相互参照させるのが現行の書き方。
 */
export default function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/flexq-logo.svg"),
        email: CONTACT_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          availableLanguage: ["ja"],
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "ja",
        publisher: { "@id": absoluteUrl("/#organization") },
      },
      {
        "@type": "MobileApplication",
        "@id": absoluteUrl("/#app"),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        applicationCategory: "MusicApplication",
        operatingSystem: "iOS, Android",
        inLanguage: "ja",
        url: SITE_URL,
        publisher: { "@id": absoluteUrl("/#organization") },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "JPY",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify の結果のみを埋め込む（外部入力は含めていない）
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
