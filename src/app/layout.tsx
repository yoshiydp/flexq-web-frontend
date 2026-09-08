import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Qwigley } from "next/font/google";
import SmoothScroll from "@/components/layout/SmoothScroll";
import {
  IS_INDEXABLE,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const qwigley = Qwigley({
  variable: "--font-qwigley",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  // canonical / OG / Twitter の相対パスをこの URL 基準で絶対 URL に解決させる
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // サブページは title に画面名だけを書けば「NEWS | FlexQ」になる
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  // 一般公開前は検索エンジン・AI クローラーに拾わせない（src/lib/site.ts で切り替え）。
  // 公開後は max-image-preview / max-snippet を開けて OG 画像と要約が使われるようにする
  robots: IS_INDEXABLE
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true },
      },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  // 電話番号・メールアドレスの自動リンク化を止める（iOS Safari が数字を電話番号にする）
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  // ダークテーマ固定のサイトなので、ブラウザ UI の配色もそれに合わせる
  themeColor: "#0D0D0D",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${qwigley.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* JS 無効時はスクロール連動リビール（Reveal）の非表示状態を解除して
            サーバー描画のコンテンツをそのまま見せる */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>.reveal-up,.reveal-line{opacity:1;transform:none;transition:none}</style>",
          }}
        />
        {/* 慣性スクロール。ページ遷移で再マウントされないようルートに置く */}
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
