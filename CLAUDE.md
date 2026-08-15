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
│   │   └── ui/                # shadcn/ui コンポーネント（npx shadcn add で追加）
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

| ブランチ | 役割 |
|---------|------|
| `master` | 本番リリース用。staging で確認済みのものをマージ |
| `staging` | 表示・挙動確認用。develop から適宜マージして使用 |
| `develop` | 開発ベースブランチ。feature ブランチの統合先 |
| `feature/*` | 機能ごとの作業ブランチ |

> `staging` は `develop` と常に一致するわけではありません。確認したいタイミングで `develop` → `staging` へマージします。

### 日常の開発フロー

```bash
# 1. develop から feature ブランチを切る
git checkout develop
git checkout -b feature/xxx

# 2. 実装・コミット

# 3. develop へ PR を作成してマージ

# 4. staging で確認したいとき → develop を staging へマージ
git checkout staging
git merge develop
git push origin staging   # Vercel に自動デプロイ → 確認用 URL で確認

# 5. 本番リリース → staging を master へマージ
git checkout master
git merge staging
git push origin master    # Vercel に本番デプロイ
```

---

## デプロイフロー

### Vercel プロジェクト情報

| 項目 | 値 |
|------|---|
| プロジェクト名 | `flexq-web`（FlexQ Web チーム。旧 `lyrics-web-frontend` から 2026-08-15 リネーム） |
| 本番 URL | https://flexq-web-frontend.vercel.app |
| 旧 URL | `lyrics-web-frontend.vercel.app`（新 URL へ 307 リダイレクト） |
| ダッシュボード | Vercel「FlexQ Web」チーム内の `flexq-web` プロジェクト |

> 本番用の独自ドメイン（外部レジストラで取得予定）は未設定。追加したら本番 URL をそちらに更新し、`flexq-web-frontend.vercel.app` はテスト・確認用として並存させる。

### 自動デプロイ（GitHub 連携済み）

| ブランチ | デプロイ先 | URL |
|---------|-----------|-----|
| `master` | Production | https://flexq-web-frontend.vercel.app |
| `staging` | Preview | `flexq-web-git-staging-*.vercel.app`（固定・正確な URL はダッシュボード参照） |
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
2. ホスティング側の env に `FRONTEND_URLS=https://flexq-web-frontend.vercel.app` を設定（CORS）
3. Vercel の Production 環境変数 `NEXT_PUBLIC_STRAPI_URL` に CMS の URL を設定 → **Redeploy**
4. 管理画面で本番コンテンツ（記事・CTA のストア URL・アプリスクリーンショット）を投入 → ISR（60 秒）で反映
