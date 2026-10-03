# CLAUDE.md

このファイルは、リポジトリ内のコードを操作する際に Claude Code (claude.ai/code) へのガイダンスを提供します。

## コマンド

```bash
# 開発サーバー起動
yarn dev

# 本番ビルド
yarn build

# 本番起動（ビルド済みの場合）
yarn start

# Lint
yarn lint

# ユニットテスト (Jest)
yarn test                 # ウォッチモード
yarn test:ci              # カバレッジ付き実行 (CI)

# 単一テストファイルの実行
yarn test src/components/ui/StoreLinks.test.tsx

# E2E テスト (Playwright) ※ 事前に yarn build が必要（webServer が yarn start を自動起動）
yarn e2e                  # 全フロー（desktop / mobile 両プロジェクト）
yarn e2e:ui               # UI モードでデバッグ実行
npx playwright test e2e/top-page.spec.ts   # 単一フロー
```

開発サーバー: `http://localhost:3000`

---

## アーキテクチャ

### 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/ui（style: base-nova） |
| ホスティング | Vercel |
| CMS / API | Strapi v5（lyrics-web-strapi） |
| ランタイム | Node.js v22 |
| パッケージマネージャー | Yarn |

### 関連リポジトリ

| リポジトリ | 役割 |
|-----------|------|
| `lyrics-web-frontend`（本リポジトリ） | Next.js フロントエンド |
| `lyrics-web-strapi` | Headless CMS バックエンド（Strapi v5） |

---

## ローカル開発環境のセットアップ

### 前提条件

- Node.js v22 以上
- Yarn
- `lyrics-web-strapi` がローカルで起動済み（`http://localhost:1337`）
  - Strapi 側で Content API のパブリック権限を設定済みであること（詳細は lyrics-web-strapi の CLAUDE.md 参照）

### 環境変数

`.env.local.example` をコピーして `.env.local` を作成します。

```bash
cp .env.local.example .env.local
```

`.env.local` の設定値：

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

> `.env.local` は `.gitignore` に含まれており、コミットされません。

### 依存関係インストール

```bash
yarn install --ignore-engines
```

> Node.js v22.11.0 で eslint-visitor-keys の engines 制約が発生するため `--ignore-engines` を付けています。

### 開発サーバー起動

```bash
yarn dev
```

`http://localhost:3000` でアクセスできます。

---

## プロジェクト構成

```
lyrics-web-frontend/
├── src/
│   ├── app/                   # App Router ルート
│   │   ├── layout.tsx          # ルートレイアウト（Qwigley フォント登録）
│   │   ├── page.tsx            # トップページ (/) ・キービジュアル
│   │   ├── globals.css         # グローバルスタイル・shadcn/ui CSS 変数
│   │   └── news/
│   │       ├── page.tsx        # ニュース一覧 (/news)
│   │       └── [slug]/
│   │           └── page.tsx    # ニュース詳細 (/news/[slug])
│   ├── components/
│   │   ├── canvas/            # WebGL キービジュアル（react-three-fiber）
│   │   │   ├── GlitchCanvasLoader.tsx
│   │   │   ├── GlitchCanvas.tsx
│   │   │   ├── GlitchScene.tsx
│   │   │   └── shaders.ts
│   │   ├── layout/
│   │   │   ├── PageTransition.tsx  # ページ遷移のフェードイン / アウト
│   │   │   └── SmoothScroll.tsx    # 慣性スクロール（Lenis）・ページ内アンカーの処理
│   │   └── ui/                # shadcn/ui コンポーネント（npx shadcn add で追加）
│   │       ├── Reveal.tsx     # スクロール連動リビールのトリガー（IntersectionObserver）
│   │       └── SectionHeader.tsx  # セクション見出し（フェード + 罫線の伸長アニメーション）
│   ├── lib/
│   │   └── utils.ts           # cn() ユーティリティ
│   ├── hooks/                 # カスタムフック
│   └── types/
│       └── glsl.d.ts          # .glsl ファイル型定義
├── components.json            # shadcn/ui 設定
├── .env.local                 # 環境変数（gitignore 済み）
├── .env.local.example         # 環境変数テンプレート
├── next.config.ts             # Next.js 設定
└── tsconfig.json
```

---

## スクロール演出（慣性スクロール・リビール）

### 慣性スクロール（Lenis）

`src/components/layout/SmoothScroll.tsx` がルートレイアウトで [Lenis](https://github.com/darkroomengineering/lenis) を初期化し、wheel / トラックパッドのスクロールに慣性（`lerp: 0.1`）を付ける。タッチ操作は OS ネイティブのまま。

- `prefers-reduced-motion` は Lenis 自身が尊重する（補間なし・`scrollTo` は即時ジャンプ）
- 同一ページ内のアンカー（`#features` など）は `SmoothScroll` が既定のジャンプを止め、`history.pushState` でハッシュを更新してから `lenis.scrollTo` する（Lenis の `anchors` オプションはハッシュを更新しないため自前で処理している。E2E の `toHaveURL(/#statement$/)` がこれに依存）
- `lenis.css` は html / body の `height` を auto にして `min-h-full` を壊すため取り込まず、必要な分だけ `globals.css` に書いている（`html.lenis { scroll-behavior: auto }` で CSS の smooth scroll との二重補間を防ぐ）
- ネイティブスクロールをそのまま使わせたい要素には `data-lenis-prevent`（wheel のみなら `data-lenis-prevent-wheel`）を付ける。AppPreview の SP 横スクロールカルーセルは、トラックパッドの横ジェスチャーに混じる僅かな縦成分を Lenis が奪わないよう `data-lenis-prevent-wheel` を付けている
- `naiveDimensions: true` は必須。`html` が `h-full` で高さ固定のため ResizeObserver ではコンテンツ高の変化（FAQ の開閉・ページ遷移）を検知できず、スクロール下限が古いまま残る
- アンカー到着後は移動先セクションへフォーカスを移す（`tabindex=-1` を付与・`preventScroll`）。既定のアンカー遷移と同じく、以降の Tab 移動がそのセクションから続くようにするため
- `stopInertiaOnNavigate: true` + `usePathname` 監視 + `popstate` 監視で、別ページへの遷移・同一ページ内の戻る / 進むの際に慣性を止める（残っていると Lenis が古い目標位置へ動き続け、Next.js の先頭スクロールやブラウザの復元位置を上書きする）
- ページ遷移を伴わない画面切り替えでプログラムからスクロールする場合（お問い合わせフォームのステップ移動など）は、先に `src/lib/smoothScroll.ts` の `stopScrollInertia()` を呼ぶ（`SmoothScroll` がイベントを受けて慣性を止める）
- **慣性が動いている最中の `window.scrollTo(..., instant)` は Lenis に上書きされる**（E2E や検証スクリプトで instant スクロールする場合は、慣性が止まってから行う）

### スクロール連動リビール（Reveal）

トップページのキービジュアル以下は、画面内に入ったタイミングで一度だけアニメーションする。

| 部品 | 役割 |
|------|------|
| `src/components/ui/Reveal.tsx` | トリガー。IntersectionObserver で画面内に入ると `is-revealed` クラスを付ける（要素上端が画面下端からビューポート高さの 15% 入った位置で発火。`rootMargin` の % は幅基準で解決されるため px で計算しリサイズで作り直す。既にスクロール済みで画面より上にある要素は即時表示） |
| `globals.css` の `reveal-up` | 下 → 上へのフェードイン（0.9s） |
| `globals.css` の `reveal-line` | 罫線が 0 → 100% に伸びる（1.1s・`scaleX`。既定は左端から、`reveal-line-rtl` は右端から） |
| `--reveal-delay` | 段差表示。`Reveal` の `delay` prop（ms）または `[--reveal-delay:200ms]` |

- `Reveal` 自身に `reveal-up` を付けても、子孫要素に付けてもよい（子孫に付けると同じトリガーで一斉に始まり、`--reveal-delay` で段差を付けられる。例: `SectionHeader` / `Statement` / `CtaSection`）
- hover で `translate` / `transition-*` ユーティリティを使う要素（Features のカード・NewsCard・FAQ の details）には直接 `reveal-up` を付けず、`Reveal` のラッパーに持たせる（`transition-property` が競合して片方が効かなくなる）。グリッドのカードはラッパーを `grid` にして高さを揃える
- リビールの CSS は `@layer components` に置いてあり、Tailwind のユーティリティで上書きできる
- 子孫要素にキーボードフォーカスが当たった場合は `is-revealed-instant` を付け、子孫の `--reveal-delay` も含めてトランジションを止めて即時に表示する（発火帯より下の FAQ などにフォーカスリングごと透明なまま止まらないようにするため。フェード途中のフォーカスも即時表示に切り替える）
- `prefers-reduced-motion` では非表示状態にせず常に表示する。IntersectionObserver が無い環境（jsdom）でも即時表示する。JS 無効時は `layout.tsx` の `<noscript>` スタイルで非表示状態を解除する（クライアントバンドルの読み込み失敗までは救えない）
- E2E の `toBeVisible()` は opacity を見ないため、非表示状態でも通る。位置を厳密に見るテストはアニメーション終了（約 1.2s）を待つ

---

## ページ構成

| パス | ファイル | 説明 |
|------|---------|------|
| `/` | `src/app/page.tsx` | トップページ（Hero〜CTA の全セクション） |
| `/news` | `src/app/news/page.tsx` | ニュース一覧 |
| `/news/[slug]` | `src/app/news/[slug]/page.tsx` | ニュース詳細 |
| `/tutorials` | `src/app/tutorials/page.tsx` | チュートリアル一覧 |
| `/tutorials/[slug]` | `src/app/tutorials/[slug]/page.tsx` | チュートリアル詳細 |
| `/columns` | `src/app/columns/page.tsx` | コラム一覧 |
| `/columns/[slug]` | `src/app/columns/[slug]/page.tsx` | コラム詳細 |
| `/contact` | `src/app/contact/page.tsx` | お問い合わせフォーム（入力 → 確認 → 完了） |

> `/robots.txt` は `src/app/robots.ts` が生成する（後述の SEO / メタタグを参照）。

### お問い合わせフォーム（/contact）

| ファイル | 役割 |
|---------|------|
| `src/components/contact/ContactForm.tsx` | 入力 / 入力確認 / 送信完了の 3 ステップ（クライアント）。目的（プルダウン・必須）/ メールアドレス（必須）/ 本文（必須）/ 添付ファイル（任意・PNG / JPG / PDF・1 ファイル 3MB・3 件・合計 4MB） |
| `src/app/contact/actions.ts` | Server Action（FormData で受信）。サーバー側で再検証 → スパム判定 → 添付の先頭バイト検査 → メール送信 |
| `src/lib/contact.ts` | 目的の選択肢・上限・バリデーション（クライアント / サーバー共通） |
| `src/lib/contactGuard.ts` | スパム対策（ハニーポット・署名付きトークンによる最小入力時間 3 秒 / 有効期限 12 時間・同一内容の連投抑制 10 分）と添付のマジックナンバー検査 |
| `src/lib/contactDelivery.ts` | 1 件の配送手順: Notion 台帳 → 運営者宛メール（台帳 URL 付き）→ 送信者宛メール。台帳かメールのどちらかが成功すれば完了扱い、両方失敗で例外。送信者宛の失敗は台帳の「控えメール未達」に記録 |
| `src/lib/contactNotion.ts` | Notion 台帳への書き込み（`@notionhq/client`・添付は File Upload API）。`NOTION_TOKEN` / `NOTION_CONTACT_DATA_SOURCE_ID` が未設定なら無効 |
| `src/lib/contactMail.ts` | 通知メールの組み立てと送信手段。運営者宛（`contact@flexqstudio.com`・内容 + 添付・reply-to は送信者）と送信者宛（受付完了 + 入力内容の控え）の 2 通。`MailTransport`（1 通の送信手段: `ses` / `resend` / `log`）。SES は nodemailer の SES トランスポート（SES v2・raw MIME）で添付ごと送る |

- 環境変数: `CONTACT_MAIL_PROVIDER`（`ses` / `resend` / `log`。未指定なら `AWS_SES_ACCESS_KEY_ID` → ses、`RESEND_API_KEY` → resend、どちらもなければ開発環境は log・本番はエラー）、`AWS_SES_REGION` / `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY`（送信専用 IAM ユーザー。Vercel 予約名の `AWS_ACCESS_KEY_ID` とは別名）、`CONTACT_FROM_EMAIL`（差出人）、`CONTACT_TO_EMAIL`（運営者宛の受信先の上書き。サンドボックスでのテスト用）、`CONTACT_FORM_SECRET`（トークン署名キー。本番では必ず設定する）
- Notion 台帳: ページ「FlexQ お問い合わせ管理」（https://app.notion.com/p/3ee780496c2f81a7a988f6de784ee75f・運営者と共有する前提でトップレベルに作成）内のデータベース「お問い合わせ一覧」（data source `4a2abac5-74d1-42d8-88eb-cc915ab70f0f`）。プロパティ名は `contactNotion.ts` の `PROP` と一致させる。ステータスは 新着 → 対応中 → 完了（保留 / 迷惑）。書き込みには内部インテグレーションを作成して台帳ページに接続し、`NOTION_TOKEN` に設定する
- SES の運用: 開発中は**開発者アカウント**（サンドボックス。差出人・宛先とも検証済みアドレスのみ）の送信専用 IAM ユーザーで接続し、リリース前に **運営者アカウント**（本番アクセス承認済み・`noreply@flexqstudio.com` のドメイン検証 / DKIM / DMARC 整備済み）の送信専用 IAM ユーザーへ Vercel の環境変数を差し替える（Preview = staging と Production）。IAM ポリシーは `ses:SendEmail` / `ses:SendRawEmail` のみ・`ses:FromAddress` を差出人に限定する。SAM デプロイ用の `flexq-deploy` キーは流用しない
- 添付ファイルは保存せずメールに添付して転送するだけ（ストレージ不要）。`next.config.ts` の `serverActions.bodySizeLimit`（5mb）は Vercel の関数上限 4.5MB に合わせたもので、これ以上は増やせない
- 回数制限（`contactGuard.ts` の `RateLimiter`・Server Action で適用）: 同一 IP 5 回 / 10 分、同一宛先アドレス 3 回 / 10 分、インスタンス全体 60 回 / 時。送信者宛の受付メールを悪用したメール爆撃と送信枠の消費を抑えるため、内容とは独立に縛る。メモリ上の実装でインスタンスをまたぐと効かないため、公開後に悪用が見られたら Vercel Firewall のレート制限（`/contact` への POST）か外部ストアを追加する。同じ内容の同時送信は 1 回の配送にまとめ、配送に失敗した送信は連投扱いにしない
- スパム対策は外部サービスを使わない方針。bot と判定した送信はエラーを返さず成功画面を出す（対策の存在を悟らせないため）。連投抑制は Lambda インスタンス内のメモリによるベストエフォート
- Resend を使うには送信ドメイン（flexqstudio.com）の認証レコードを ConoHa の DNS に追加する必要がある
- Strapi に問い合わせを保存する構成へ移行する場合も、エントリーポイントは Server Action のまま（スパム判定・検証を Next 側に残す）にし、`getContactDelivery` で Strapi へ投稿する `ContactDelivery` に差し替える

---------|------|
| `src/components/contact/ContactForm.tsx` | 入力 / 入力確認 / 送信完了の 3 ステップ（クライアント） |
| `src/app/contact/actions.ts` | Server Action。サーバー側で再検証 → スパム判定 → メール送信 |
| `src/lib/contact.ts` | 目的の選択肢・バリデーション（クライアント / サーバー共通） |
| `src/lib/contactGuard.ts` | スパム対策（ハニーポット・署名付きトークンによる最小入力時間 3 秒 / 有効期限 12 時間・同一内容の連投抑制 10 分） |
| `src/lib/contactMail.ts` | `contact@flexqstudio.com` 宛のメール送信（Resend API を fetch で呼ぶ） |

- 環境変数: `CONTACT_MAIL_PROVIDER`（`ses` / `resend` / `log`。未指定なら `AWS_SES_ACCESS_KEY_ID` → ses、`RESEND_API_KEY` → resend、どちらもなければ開発環境は log・本番はエラー）、`AWS_SES_REGION` / `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY`（送信専用 IAM ユーザー。Vercel 予約名の `AWS_ACCESS_KEY_ID` とは別名）、`CONTACT_FROM_EMAIL`（差出人）、`CONTACT_TO_EMAIL`（運営者宛の受信先の上書き。サンドボックスでのテスト用）、`CONTACT_FORM_SECRET`（トークン署名キー。本番では必ず設定する）
- Notion 台帳: ページ「FlexQ お問い合わせ管理」（https://app.notion.com/p/3ee780496c2f81a7a988f6de784ee75f・運営者と共有する前提でトップレベルに作成）内のデータベース「お問い合わせ一覧」（data source `4a2abac5-74d1-42d8-88eb-cc915ab70f0f`）。プロパティ名は `contactNotion.ts` の `PROP` と一致させる。ステータスは 新着 → 対応中 → 完了（保留 / 迷惑）。書き込みには内部インテグレーションを作成して台帳ページに接続し、`NOTION_TOKEN` に設定する
- SES の運用: 開発中は**開発者アカウント**（サンドボックス。差出人・宛先とも検証済みアドレスのみ）の送信専用 IAM ユーザーで接続し、リリース前に **運営者アカウント**（本番アクセス承認済み・`noreply@flexqstudio.com` のドメイン検証 / DKIM / DMARC 整備済み）の送信専用 IAM ユーザーへ Vercel の環境変数を差し替える（Preview = staging と Production）。IAM ポリシーは `ses:SendEmail` / `ses:SendRawEmail` のみ・`ses:FromAddress` を差出人に限定する。SAM デプロイ用の `flexq-deploy` キーは流用しない
- スパム対策は外部サービスを使わない方針。bot と判定した送信はエラーを返さず成功画面を出す（対策の存在を悟らせないため）。連投抑制は Lambda インスタンス内のメモリによるベストエフォート
- Resend を使うには送信ドメイン（flexqstudio.com）の認証レコードを ConoHa の DNS に追加する必要がある

---

## SEO / メタタグ

### 値の置き場所

| ファイル | 役割 |
|---------|------|
| `src/lib/site.ts` | サイト URL・サイト名・説明文・お問い合わせ先・index 可否の定数。**値を変えるときはここだけ** |
| `src/lib/metadata.ts` | サブページ共通の metadata を組み立てる `pageMetadata()` |
| `src/app/layout.tsx` | サイト全体の既定値（title テンプレート・OG・Twitter・robots・theme-color） |
| `src/app/robots.ts` | `/robots.txt` |
| `src/app/sitemap.ts` | `/sitemap.xml`（`IS_INDEXABLE` が false の間は空で返す） |
| `src/components/seo/StructuredData.tsx` | トップページの JSON-LD（Organization / WebSite / MobileApplication） |
| `public/og.png` | OG 画像（1200x630） |

### 注意点

- **`openGraph` / `twitter` はフィールド単位でマージされない。** ページ側で一部だけ定義すると、
  ルート（`layout.tsx`）で定義した `og:image` や `og:type` が丸ごと消える。
  サブページは必ず `pageMetadata()` を通すこと
- タイトルはルートの `template: "%s | FlexQ"` が付けるため、各ページの `title` には画面名だけを書く
  （トップページのみ `title: { absolute: ... }` でテンプレートを回避している）
- `SITE_DESCRIPTION` / `SITE_TITLE` は `src/content/fallbacks.ts` の `seoDescription` / `seoTitle`
  からも参照している。CMS 未投入時に metadata とページ内容が食い違わないようにするため

### 公開時にやること

1. `src/lib/site.ts` の `ALLOW_INDEXING` を `true` にする
   → noindex が外れ、`/robots.txt` が `Allow: /` + `Sitemap:` になり、`/sitemap.xml` に URL が並ぶ。
   Preview デプロイ（feature / staging）は `VERCEL_ENV` の判定により公開後も noindex のまま
2. Google Search Console に `flexqstudio.com` を登録し、`/sitemap.xml` を送信する

> 独自ドメインの設定（Vercel へのドメイン追加・DNS・`NEXT_PUBLIC_SITE_URL`）は 2026-09-06 に完了済み。
> **`ALLOW_INDEXING` を戻し忘れると、公開しても検索結果に一切出ない**ため、リリース手順に必ず含めること。

---

## Strapi API 連携

### データ取得方針

Strapi の REST API を Next.js の `fetch` + `revalidate`（ISR）で取得します。

```typescript
// ISR: 60秒ごとに再生成
const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/news-articles?populate=*&sort=publishedAt:desc`, {
  next: { revalidate: 60 },
});
```

取得・マッピング・フォールバック処理は `src/lib/strapi.ts`（fetch ラッパー）と `src/lib/content.ts`（コンテンツ解決層）に集約されています。新しい API を叩く場合もこの 2 ファイルを経由してください。

### API エンドポイント

> パスは各 content type の `pluralName` に基づきます（News の pluralName は `news-articles`。`/api/news` ではないことに注意）。

```
# トップページ (single type)
GET /api/top-page?populate[features]=*&populate[screens][populate]=screenshot&populate[faqs]=*&populate[cta]=*

# ニュース一覧
GET /api/news-articles?populate=*&sort=publishedAt:desc

# ニュース詳細（スラッグ指定）
GET /api/news-articles?filters[slug][$eq]={slug}&populate=*

# チュートリアル一覧（連載順）
GET /api/tutorials?populate=*&sort=order:asc

# コラム一覧
GET /api/columns?populate=*&sort=publishedAt:desc
```

### レスポンス形式（Strapi v5 REST）

Strapi v5 では `data` 配列の各要素がフラットな属性構造になっています（v4 の `attributes` ネストは廃止）。

```typescript
// Strapi v5 のレスポンス例
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "title": "記事タイトル",
      "slug": "article-slug",
      "excerpt": "概要テキスト",
      "publishedAt": "2026-01-01T00:00:00.000Z",
      "category": { "id": 1, "name": "カテゴリー名", "slug": "category-slug" }
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 25, "pageCount": 1, "total": 10 } }
}
```

---

## パスエイリアス

`@/` は `src/` に対応します（`tsconfig.json` で設定済み）。

```typescript
import { SomeComponent } from '@/components/SomeComponent';
```

---

## スタイリング

Tailwind CSS v4 を使用します。`src/app/globals.css` に `@import "tailwindcss"` が設定されています。

---

## WebGL キービジュアル（react-three-fiber）

### 概要

ホームページのキービジュアルに **react-three-fiber (R3F v9 RC)** + **GLSL カスタムシェーダー** を使用しています。
Next.js 16 + React 19 の組み合わせには R3F v8 が非対応のため、v9 RC を使用しています。

### 関連パッケージ

| パッケージ | バージョン | 用途 |
|----------|----------|------|
| `three` | 0.185.0 | WebGL コアライブラリ |
| `@react-three/fiber` | 9.0.0-rc.10 | React 19 対応の R3F |
| `@react-three/drei` | 10.7.7 | ユーティリティ集 |
| `@types/three` | 0.185.0 | 型定義 |

### ファイル構成

```
src/components/canvas/
├── GlitchCanvasLoader.tsx  # SSR 無効の動的インポートラッパー（'use client'）
├── GlitchCanvas.tsx        # R3F <Canvas> ラッパー
├── GlitchScene.tsx         # シェーダー Mesh + useFrame アニメーション
├── shaders.ts              # GLSL 頂点・フラグメントシェーダー（文字列エクスポート）
├── glitch.vert.glsl        # 頂点シェーダー（参考用）
└── glitch.frag.glsl        # フラグメントシェーダー（参考用）

src/types/
└── glsl.d.ts               # .glsl ファイルの TypeScript 型定義
```

### シェーダーの表現内容

| レイヤー | 表現 |
|---------|------|
| 同心円ウェーブリング | mid / treble のサイン波で広がる波紋 |
| 水平ウェーブフォーム | 複数の無理数比速度を持つサインハーモニクス（数百秒リピートなし） |
| グリッチブロック | ランダムな水平ズレ・バースト |
| RGB 色収差 | クロマティックアベレーション |
| ビネット | 周辺減光 |

**カラー**: lyrics-mobile パレットの purple `#6C3483` + gold `#FFD700` を使用。

### フルスクリーン対応

頂点シェーダーで **クリップ空間直接出力** を使用し、カメラ・FOV・アスペクト比をバイパスします。

```glsl
/* クリップ空間直接出力 — アスペクト比に依存しない */
gl_Position = vec4(position.xy, 0.0, 1.0);
```

ウィンドウリサイズ時は R3F の `resize={{ debounce: 0 }}` + `useFrame` 内の `uResolution` 更新で即時対応します。

### Next.js 設定

`next.config.ts` に `transpilePackages: ["three"]` が必要です（ESM/CJS 混在の解決）。

```typescript
const nextConfig: NextConfig = {
  transpilePackages: ["three"],
};
```

### コンポーネントの使い方

```tsx
// Server Component から使用する場合は GlitchCanvasLoader を使う
// （ssr: false は Server Component に置けないため）
import GlitchCanvasLoader from "@/components/canvas/GlitchCanvasLoader";

<section className="relative h-screen w-full overflow-hidden">
  <GlitchCanvasLoader />
</section>
```

### フォント

ロゴ "Lyrics" には Google Fonts の **Qwigley**（筆記体）を使用しています。
`layout.tsx` で `next/font/google` から読み込み、`--font-qwigley` CSS 変数として提供しています。

---

## UI コンポーネント（shadcn/ui）

### 概要

shadcn/ui（style: `base-nova`、Tailwind CSS v4 対応）を採用しています。  
コンポーネントは npm パッケージではなく**コードとしてコピーして所有**するため、`src/components/ui/` に配置されます。

### コンポーネントの追加

```bash
npx shadcn@latest add button
npx shadcn@latest add input card dialog
```

設定ファイルは `components.json`（リポジトリルート）です。

### ユーティリティ

`src/lib/utils.ts` に `cn()` 関数を提供しています。Tailwind クラスの合成に使います。

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

### カラーパレット

`src/app/globals.css` に CSS 変数として定義されています。**lyrics-mobile（`apps/mobile/src/globalStyles/colors.ts`）のカラーを移植**しています。

| CSS 変数 | 値 | モバイル参照元 |
|---------|-----|--------------|
| `--background` | `#0D0D0D` | `base.bgDefault` |
| `--foreground` | `#EFEFEF` | `font.default` |
| `--primary` / `--accent` | `#FFD700` | `accent.goldPrimary`（ゴールド） |
| `--secondary` | `#192126` | `navigation.bg` |
| `--muted` | `#1C1C1C` | `surface.waveform` |
| `--destructive` | `#C1272D` | `action.record` |
| `--border` | `#333333` | `base.borderDefault` |
| `--input` | `#999999` | `form.default.border` |
| `--ring` | `#FFD700` | `accent.goldPrimary` |

> カラーを変更する場合は `globals.css` の `:root` ブロックのみを編集してください。`colors.ts`（モバイル側）と同期が取れているか確認してください。

### 関連パッケージ

| パッケージ | 用途 |
|----------|------|
| `clsx` + `tailwind-merge` | クラス名合成（`cn()` ユーティリティ） |
| `class-variance-authority` | バリアント定義（`cva()`） |
| `tw-animate-css` | Tailwind v4 向けアニメーション |
| `lucide-react` | アイコン |
| `@base-ui/react` | アクセシブルなプリミティブ（Dialog 等） |

---

## テスト

### ユニットテスト（Jest + Testing Library）

- テストはソースファイルと同じ場所に配置します（`Component.tsx` の隣に `Component.test.tsx`。flexq-mobile と同じ流儀）
- 設定: `jest.config.mjs`（`next/jest` プリセット・jsdom 環境）+ `jest.setup.ts`（`@testing-library/jest-dom`）
- `src/components/canvas/`（WebGL）は jsdom でテスト不能のためカバレッジ対象外
- データ層（`src/lib/content.ts`）のテストは `global.fetch` をモックして行う（実 Strapi には接続しない）
- リンクテキストが `&nbsp;` 区切りの要素（例: `VIEW ALL →`）は正規表現 `\s` でマッチさせる

### E2E テスト（Playwright）※ flexq-mobile の Maestro に相当

フローは `e2e/*.spec.ts` に配置します。`desktop` / `mobile`（iPhone 14 ビューポート）の 2 プロジェクトで全フローが実行されます。

**実行前提:**
- `yarn build` 済みであること（`playwright.config.ts` の webServer が `yarn start --port 3200` を自動起動・終了する）
- 起動済みサーバーを流用する場合は `PLAYWRIGHT_BASE_URL=http://localhost:3000 yarn e2e`
- Strapi（localhost:1337）は**起動していなくてもよい**。トップページはフォールバック文言で描画され、記事フローはデータがなければ空状態を検証する設計
- 初回のみ `npx playwright install chromium` が必要

**フロー作成時のルール:**
- ロケーターはセクションにスコープする（例: `page.locator("#faq").getByText(...)`）。同一文言が News 抜粋と FAQ 回答など複数箇所に存在し得るため
- ビューポート依存の UI（PC ナビ / SP メニュー）は `test.skip(isMobile, ...)` / `test.skip(!isMobile, ...)` で分岐する
- SP メニューのオーバーレイは `data-testid="mobile-menu"` で特定する
- CMS データに依存するアサーションは「データあり / 空状態」のどちらでも成立するように書く

### コードレビュー（Codex CLI）

コミット前に `/codex-review` を実行し、妥当な指摘に対応してからコミットする。実体は `codex review --base develop`（要 Codex CLI: `npm install -g @openai/codex` + `codex login`）。今回の diff と無関係な既存問題・誤検知は対応せず、その旨を報告する。コマンド定義: `.claude/commands/codex-review.md`

---

## ブランチ運用

```
master
  └── develop
        └── feature/xxx   # 作業ブランチ
```

| ブランチ | 役割 | マージ方法 |
|---------|------|-----------|
| `master` | 本番リリース用。staging で確認済みのものをマージ | **PR 必須**（`staging` → `master`） |
| `staging` | 表示・挙動確認用。develop から適宜マージして使用 | 直接マージ |
| `develop` | 開発ベースブランチ。feature ブランチの統合先 | **PR 必須**（`feature/*` → `develop`） |
| `feature/*` | 機能ごとの作業ブランチ | — |

> `staging` は `develop` と常に一致するわけではありません。確認したいタイミングで `develop` → `staging` へマージします。

### 日常の開発フロー

```bash
# 1. develop から feature ブランチを切る
git checkout develop
git checkout -b feature/xxx

# 2. 実装・コミット

# 3. develop へ PR を作成してマージ

# 4. develop を staging へ直接マージ（PR は不要）
git checkout staging
git merge develop
git push origin staging   # Vercel が Preview を自動ビルド

# 5. staging の Preview で内容を目視確認 ★ここを飛ばさない
#    https://flexq-web-git-staging-flexq-web.vercel.app
vercel ls flexq-web | head -10   # state が READY になってから開く

# 6. 本番リリース → staging から master へ PR を作成してマージ
gh pr create --base master --head staging

# 7. 本番 URL で反映結果を確認
curl -s -o /dev/null -w "%{http_code}\n" https://flexqstudio.com/
```

> **`master` へマージする前に、必ず `staging` の Preview で内容を確認すること。**
> 本番は独自ドメインで一般に到達できる状態であり、`master` へのマージは即座に反映される。
> 差し戻しのコストが高いため、Preview の目視確認と PR の差分レビューを通してからマージする
> （`develop` → `staging` は従来どおり直接マージでよい）。
>
> Preview は Vercel Authentication で保護されており、匿名アクセスは 302 で SSO に飛ぶ。
> ログイン済みのブラウザからは閲覧できるが、`curl` での自動確認はできない。
> meta タグや robots.txt を機械的に確認したい場合は、ローカルで `yarn build && yarn start` する。
>
> 確認観点とトラブルシューティングは `docs/custom-domain-and-release.md` を参照。

---

## デプロイフロー

### Vercel プロジェクト情報

| 項目 | 値 |
|------|---|
| プロジェクト名 | `flexq-web`（FlexQ Web チーム。旧 `lyrics-web-frontend` から 2026-08-15 リネーム） |
| 本番 URL | https://flexqstudio.com （`www` も同じ内容を配信） |
| 予備 URL | `flexq-web-frontend.vercel.app`（確認用として並存） |
| 旧 URL | `lyrics-web-frontend.vercel.app`（`flexq-web-frontend.vercel.app` へ 307 リダイレクト） |
| ダッシュボード | Vercel「FlexQ Web」チーム内の `flexq-web` プロジェクト |

### 独自ドメイン（flexqstudio.com）

2026-09-06 に設定完了。レジストラはお名前.com、**DNS とメールは ConoHa WING に残したまま**、A レコードだけ Vercel に向けている。

| レコード | 値 | 用途 |
|---------|---|------|
| `A @` / `A www` | `76.76.21.21` | Vercel（サイト配信） |
| `MX @` | `mail1061.conoha.ne.jp` | `contact@flexqstudio.com` の受信 |
| `TXT @` / `TXT default._domainkey` | SPF / DKIM | メール認証 |
| `A mail` / `A ml-cp` | `157.120.209.174` | ConoHa のメール関連 |
| `NS @` | `ns-a1/a2/a3.conoha.io` | DNS |

> **ConoHa の契約は解約しないこと。** サイト配信は Vercel に移ったが、`contact@flexqstudio.com` は
> ConoHa のメールサーバーで動いており、Vercel にメール機能はない。ネームサーバーも ConoHa のため、
> 解約するにはメールと DNS の移行が先に必要になる。
> ConoHa 側の `public_html/flexqstudio.com/` は空（`error/` のみ）で、DNS 経由では到達しない。

移行の経緯・DNS の変更手順・公開前チェックリスト・トラブルシューティングは
**`docs/custom-domain-and-release.md`** にまとめてある。

### 自動デプロイ（GitHub 連携済み）

| ブランチ | デプロイ先 | URL |
|---------|-----------|-----|
| `master` | Production | https://flexqstudio.com |
| `staging` | Preview | https://flexq-web-git-staging-flexq-web.vercel.app （ブランチ固定・push のたびに最新へ貼り替わる） |
| `feature/*` 等 | Preview | ブランチごとに URL が自動発行 |

### 環境変数

Vercel に登録済みの環境変数（`vercel env ls` で確認）：

| 変数名 | 環境 | ブランチ | 説明 |
|--------|------|---------|------|
| `NEXT_PUBLIC_STRAPI_URL` | Development | — | ローカル開発用 Strapi URL |
| `NEXT_PUBLIC_STRAPI_URL` | Preview | `staging` | Staging 用 Strapi URL |
| `NEXT_PUBLIC_STRAPI_URL` | Production | — | 本番 Strapi URL |

```bash
vercel env ls                                               # 一覧確認
vercel env add NEXT_PUBLIC_STRAPI_URL preview staging       # staging 用を更新
vercel env add NEXT_PUBLIC_STRAPI_URL production            # 本番用を更新
vercel env rm NEXT_PUBLIC_STRAPI_URL production             # 削除
```

> **Strapi Cloud デプロイ後:** `staging` と `production` の `NEXT_PUBLIC_STRAPI_URL` を Strapi Cloud の各環境 URL に更新してください。

```bash
# staging 用（Strapi Cloud の STG URL に変更）
vercel env rm NEXT_PUBLIC_STRAPI_URL preview
echo "https://your-strapi-staging.strapiapp.com" | vercel env add NEXT_PUBLIC_STRAPI_URL preview staging

# 本番用（Strapi Cloud の本番 URL に変更）
vercel env rm NEXT_PUBLIC_STRAPI_URL production
echo "https://your-strapi-prod.strapiapp.com" | vercel env add NEXT_PUBLIC_STRAPI_URL production
```

### デプロイ前チェック

```bash
yarn lint      # Lint エラーがないか確認
yarn test:ci   # ユニットテストが通るか確認
yarn build     # ビルドエラーがないか確認
yarn e2e       # E2E が通るか確認（build 後に実行）
```

---

## インフラ方針

| 環境 | フロントエンド | Strapi |
|------|--------------|--------|
| ローカル | `yarn dev`（localhost:3000） | `yarn develop`（localhost:1337） |
| STG | Vercel Preview（`staging` ブランチ） | 未接続（CMS 休止中） |
| 本番 | Vercel Production（`master` ブランチ） | 未接続（CMS 休止中） |

### CMS 休止中の運用（2026-08-15 決定）

Strapi Cloud が基本有料のため、**本番 CMS の接続は当面見送り**とした（運営側の方針としても LP はアプリの訴求に焦点を当てる）。今後の運用状況を見て復活を判断する。

- 本番はフォールバック文言（`src/content/fallbacks.ts`）による**静的 LP として公開中**。トップページは完成状態で表示され、News / Learn セクション・そのナビリンク・記事ページ導線は自動的に非表示になる（この挙動は設計どおり）
- **CMS 連携の実装（記事ページ・top-page single type・データ層）はコードとして温存**する。削除しないこと。ローカル開発では従来どおり `lyrics-web-strapi` を起動すれば全機能を確認できる
- 文言修正は当面 `src/content/fallbacks.ts` を直接編集してリリースする

**CMS を復活させる手順**（判断が下りたらこれだけで戻せる）:
1. Strapi をホスティング（Strapi Cloud なら `lyrics-web-strapi` の master を接続。bootstrap が権限付与・初期データ投入を自動実行する）
2. ホスティング側の env に `FRONTEND_URLS=https://flexqstudio.com` を設定（CORS）
3. Vercel の Production 環境変数 `NEXT_PUBLIC_STRAPI_URL` に CMS の URL を設定 → **Redeploy**
4. 管理画面で本番コンテンツ（記事・CTA のストア URL・アプリスクリーンショット）を投入 → ISR（60 秒）で反映
