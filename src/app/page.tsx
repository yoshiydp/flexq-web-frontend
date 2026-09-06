import type { Metadata } from "next";
import { visibleNavLinks } from "@/components/layout/navLinks";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import AppPreview from "@/components/sections/AppPreview";
import CtaSection from "@/components/sections/CtaSection";
import FaqSection from "@/components/sections/FaqSection";
import Features from "@/components/sections/Features";
import Hero from "@/components/sections/Hero";
import LearnSection from "@/components/sections/LearnSection";
import NewsSection from "@/components/sections/NewsSection";
import Statement from "@/components/sections/Statement";
import StructuredData from "@/components/seo/StructuredData";
import {
  getColumnItems,
  getNewsItems,
  getTopPageContent,
  getTutorialItems,
} from "@/lib/content";
import { OG_IMAGE_PATH, SITE_NAME } from "@/lib/site";

// ISR: Strapi 更新は最長 60 秒で反映される
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getTopPageContent();
  return {
    // ルートの template（`%s | FlexQ`）を通すと二重になるため、そのまま使う
    title: { absolute: content.seoTitle },
    description: content.seoDescription,
    alternates: { canonical: "/" },
    // openGraph / twitter はオブジェクトごと上書きされる（マージされない）ため、
    // ルートで定義した type・locale・画像もここで書き直す必要がある
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: SITE_NAME,
      url: "/",
      title: content.seoTitle,
      description: content.seoDescription,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: content.seoTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seoTitle,
      description: content.seoDescription,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default async function Home() {
  const content = await getTopPageContent();
  const [news, tutorials, columns] = await Promise.all([
    getNewsItems(content.newsCount),
    getTutorialItems(content.tutorialCount),
    getColumnItems(content.columnCount),
  ]);
  // CMS が空で非表示になるセクション（News / Learn）へのアンカーはナビから除外する
  const navLinks = visibleNavLinks({
    hasNews: news.length > 0,
    hasLearn: tutorials.length > 0 || columns.length > 0,
  });

  return (
    <>
      <StructuredData />
      <SiteHeader
        links={navLinks}
        appStoreUrl={content.cta.appStoreUrl}
        googlePlayUrl={content.cta.googlePlayUrl}
      />
      <main>
        <Hero tagline={content.heroTagline} />
        <Statement statement={content.statement} />
        <Features heading={content.featuresHeading} features={content.features} />
        <AppPreview heading={content.previewHeading} screens={content.screens} />
        <NewsSection heading={content.newsHeading} items={news} />
        <LearnSection
          heading={content.learnHeading}
          tutorialSubtitle={content.tutorialSubtitle}
          tutorials={tutorials}
          columnSubtitle={content.columnSubtitle}
          columns={columns}
        />
        <FaqSection heading={content.faqHeading} faqs={content.faqs} />
        <CtaSection tagline={content.heroTagline} cta={content.cta} />
      </main>
      <SiteFooter links={navLinks} />
    </>
  );
}
