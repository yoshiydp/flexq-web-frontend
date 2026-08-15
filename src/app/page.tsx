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
import {
  getColumnItems,
  getNewsItems,
  getTopPageContent,
  getTutorialItems,
} from "@/lib/content";

// ISR: Strapi 更新は最長 60 秒で反映される
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getTopPageContent();
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    openGraph: {
      siteName: "FlexQ",
      title: content.seoTitle,
      description: content.seoDescription,
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
