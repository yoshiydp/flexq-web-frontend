# 独自ドメイン構成と本番公開までの手順

FlexQ プロモサイトの配信構成（Vercel + 独自ドメイン `flexqstudio.com`）と、
一般公開までに残っている対応をまとめる。2026-09-06 の移行作業の記録も兼ねる。

- **サイトの表示**: Vercel（`master` へのマージで自動デプロイ）
- **メール・DNS**: ConoHa WING（契約継続が必要）
- **検索エンジンからの露出**: ブロック中（`ALLOW_INDEXING = false`）

---

## 1. 配信構成

### 現行構成

```
GitHub (master)  ──自動デプロイ──▶  Vercel  ──▶  https://flexqstudio.com
                                                  https://www.flexqstudio.com

ConoHa WING  ──▶  contact@flexqstudio.com（メール）
             ──▶  ns-a1/a2/a3.conoha.io（DNS）
```

**FTP でのビルドファイルのアップロードは不要。** 当初はレンタルサーバーの公開ディレクトリへ
FTP で静的ファイルを配置する案もあったが、Vercel が独自ドメインをそのまま配信できるため採用しなかった。

FTP 方式を採らなかった理由:

| 項目 | Vercel 直接配信 | FTP + レンタルサーバー |
|------|----------------|---------------------|
| 更新作業 | `master` へマージするだけ | 毎回ビルド → 手動アップロード |
| 事故の余地 | なし | 上げ忘れ・上げ間違い |
| 確認環境 | ブランチごとに Preview URL | なし |
| TLS 証明書 | 自動発行・自動更新 | 手動管理 |
| Next.js の機能 | ISR・`next/image` が使える | `output: "export"` が必須で使えない |

### デプロイフロー

```
feature/* ──PR──▶ develop ──直接マージ──▶ staging ──PR──▶ master ──▶ 本番
                                                                   flexqstudio.com
```

- `develop` → `staging` は直接マージ（Preview URL で確認）
- `staging` → `master` は **PR 必須**（本番反映を伴うため）
- 詳細は `CLAUDE.md`「ブランチ運用」を参照

### master へマージする前の確認フロー

本番は独自ドメインで一般に到達できる状態のため、**`master` にマージする前に必ず
`staging` の Preview で内容を確認する**。差し戻しのコストが高く、`master` へのマージは
即座に本番へ反映されるため、ここを飛ばさない。

```
1. develop に feature を集約           （PR マージ）
2. develop → staging を直接マージ・push
3. Vercel が staging の Preview を自動ビルド
4. Preview URL を開いて目視確認        ← ここを必ず通す
5. 問題なければ staging → master の PR を作成
6. PR の差分をレビューしてマージ       → 本番反映
7. 本番 URL で反映結果を確認
```

**Preview URL の調べ方**

Vercel ダッシュボードの Deployments でブランチ `staging` の最新デプロイを開く。
CLI でも取得できる。

```bash
# staging の最新デプロイを確認（state が READY になってから開く）
vercel ls flexq-web | head -10
```

> Preview は Vercel Authentication で保護されており、**匿名アクセスは 302 で SSO に飛ぶ**。
> ログイン済みのブラウザからは閲覧できるが、`curl` での自動確認はできない。
> HTML の中身（meta タグや robots）を機械的に確認したい場合は、ローカルで
> `yarn build && yarn start` して同じコミットの出力を見る。

**手順 4 で確認すること**

- 変更した画面が意図どおり表示されるか（PC / SP 両方のビューポート）
- コンソールエラーが出ていないか
- 一般公開前は `<meta name="robots">` が `noindex` のままか
- 公開後はリンク先・canonical が独自ドメインを指しているか

**手順 7（本番反映後）で確認すること**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://flexqstudio.com/
curl -s https://flexqstudio.com/robots.txt
curl -s https://flexqstudio.com/ | grep -io '<meta name="robots"[^>]*>'
```

> DNS キャッシュの影響でローカルからは古い内容が見えることがある。
> 判断に迷ったら「5. トラブルシューティング」の手順で切り分ける。

### Vercel 側の設定

| 項目 | 値 |
|------|---|
| チーム | FlexQ Web |
| プロジェクト | `flexq-web` |
| 本番ドメイン | `flexqstudio.com` / `www.flexqstudio.com` |
| 予備ドメイン | `flexq-web-frontend.vercel.app`（確認用に並存） |
| Production 環境変数 | `NEXT_PUBLIC_SITE_URL=https://flexqstudio.com` |

> Preview デプロイには `NEXT_PUBLIC_SITE_URL` を設定していない。
> `src/lib/site.ts` の既定値が独自ドメインなので、未設定でも正しいドメインで組み立てられる。

---

## 2. DNS 構成

レジストラは**お名前.com**、DNS とメールは **ConoHa WING** に置いたまま、
**A レコードだけを Vercel に向けている**。

### 現在のレコード

| タイプ | 名称 | 値 | 用途 |
|-------|------|---|------|
| A | `@` | `76.76.21.21` | **Vercel**（サイト配信） |
| A | `www` | `76.76.21.21` | **Vercel**（サイト配信） |
| A | `mail` | `157.120.209.174` | ConoHa（メール） |
| A | `ml-cp` | `157.120.209.174` | ConoHa（メール） |
| MX | `@` | `mail1061.conoha.ne.jp`（優先度 10） | **メール受信** |
| TXT | `@` | `v=spf1 include:_spf.conoha.ne.jp ~all` | SPF |
| TXT | `default._domainkey` | `v=DKIM1; k=rsa; p=...` | DKIM |
| NS | `@` | `ns-a1/a2/a3.conoha.io` | DNS |

### ネームサーバーを Vercel に移さなかった理由

Vercel はネームサーバーごと移す方式（`ns1/ns2.vercel-dns.com`）も案内するが、採用していない。
移すと **MX / SPF / DKIM を Vercel DNS 側に作り直す必要があり、設定漏れでメールが止まる**。
A レコードだけの変更なら、メール関連のレコードは一切触らずに済む。

### 変更手順（ConoHa WING）

1. https://www.conoha.jp/ → ConoHa WING にログイン
2. 左メニュー **「DNS」** → ドメイン一覧から `flexqstudio.com` を選択
3. レコード一覧の**右上の鉛筆アイコン**をクリックして編集モードに入る
4. `A @` と `A www` の**「値」だけ**を `76.76.21.21` に書き換える
5. 右上の**チェックアイコン**で保存

> ⚠️ **MX / TXT / NS には触らないこと。** 触るとメールが止まる。
> レコードの追加・削除も不要で、変更するのは A レコード 2 件の値だけ。

### ⚠️ ConoHa の契約は解約しないこと

サイトの配信は Vercel に移ったが、以下が ConoHa に残っている。

| 役割 | 移行先 |
|------|-------|
| `contact@flexqstudio.com` のメール送受信 | ConoHa（**Vercel にメール機能はない**） |
| DNS（ネームサーバー） | ConoHa |

`contact@flexqstudio.com` は利用規約・プライバシーポリシー・構造化データに問い合わせ先として
記載しているため、止められない。

将来的に解約する場合は、以下の順で移行する（今すぐ動かす必要はない）。

1. メールを別サービスへ移す（Zoho Mail は独自ドメインで送受信でき無料枠がある。
   Cloudflare Email Routing は無料だが**転送専用で送信できない**ため、問い合わせ先には不向き）
2. DNS をお名前.com・Cloudflare・Vercel DNS などへ移す
3. ConoHa を解約

> ConoHa 側の `public_html/flexqstudio.com/` は空にしてある（サーバー標準の `error/` のみ）。
> DNS が Vercel を向いているため、通常のアクセスでここに到達する経路はない。

### 接続情報の在り処

ConoHa の FTP・メール（`contact@flexqstudio.com`）の接続情報は、**リポジトリには置かない**。

| 情報 | 参照先 |
|------|-------|
| FTP のホスト / ユーザー名 / パスワード | ConoHa コントロールパネル、または `docs/conoha-connection.local.md`（gitignore 済み） |
| メールのパスワード / SMTP・POP サーバー | 同上 |
| ConoHa の管理画面 | https://www.conoha.jp/ |
| レジストラ（お名前.com） | https://www.onamae.com/ |

> ⚠️ **パスワードを含む情報をコミットしないこと。** `.gitignore` で `/credentials` と
> `*.local.md` を除外している。一度コミットすると Git の履歴に残り、後からファイルを
> 削除しても取り消せない。パスワードは ConoHa の管理画面からいつでも再設定できるため、
> ファイルに固定するより管理画面で確認する運用の方が安全。

なお **FTP は通常の運用では使わない**（配信は Vercel に移行済み）。
必要が生じた場合も、平文の FTP（ポート 21）ではなく FTPS を使うこと。

---

## 3. 検索エンジンからのブロック（noindex）

アプリのストアリリース前のため、**サイトは検索エンジンに一切露出させていない**。

### 仕組み

判定はドメインではなく `src/lib/site.ts` の定数 1 箇所で決まる。

```ts
const ALLOW_INDEXING = false;   // 公開時に true にする

export const IS_INDEXABLE =
  ALLOW_INDEXING && process.env.VERCEL_ENV === "production";
```

`ALLOW_INDEXING` が `false` の間は、ドメインや環境に関係なく必ずブロックされる。
`true` にしたあとも `VERCEL_ENV` の判定により、**Preview デプロイ（feature / staging）は
公開後も noindex のまま**になる（本番とコンテンツが重複するのを防ぐため）。

| ファイル | 非公開時の挙動 |
|---------|--------------|
| `src/app/layout.tsx` | 全ページに `<meta name="robots" content="noindex, nofollow, nocache">` |
| `src/app/robots.ts` | `/robots.txt` が `Disallow: /` |
| `src/app/sitemap.ts` | `/sitemap.xml` が空の `<urlset>` |

### 現在の出力（本番で確認済み）

```
$ curl https://flexqstudio.com/robots.txt
User-Agent: *
Disallow: /

$ curl https://flexqstudio.com/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>

$ curl https://flexqstudio.com/ | grep robots
<meta name="robots" content="noindex, nofollow, nocache"/>
```

### 公開時の出力

```
$ curl https://flexqstudio.com/robots.txt
User-Agent: *
Allow: /

Host: https://flexqstudio.com
Sitemap: https://flexqstudio.com/sitemap.xml

$ curl https://flexqstudio.com/sitemap.xml
（/ ・/news ・/tutorials ・/columns ・/terms ・/privacy-policy ＋ 公開済み記事の全 URL）
```

### 補足: robots.txt と meta noindex の併用について

現在は robots.txt の全拒否と meta noindex を二重にかけている。
厳密には、**robots.txt でクロールを止めるとクローラーが meta noindex を読めない**ため、
外部リンクが存在すると URL だけがインデックスされる可能性が理論上ある。
現時点で外部リンクは存在しないため実害はなく、公開時には両方同時に解除されるので問題にならない。

---

## 4. 本番公開までに必要な対応

アプリのストアリリースに合わせて実施する。

- [ ] **`src/lib/site.ts` の `ALLOW_INDEXING` を `true` にする**
      → noindex が外れ、robots.txt が `Allow: /` + `Sitemap:` になり、sitemap.xml に URL が並ぶ。
      **これを忘れると、公開してもサイトが検索結果に一切表示されない**
- [ ] Google Search Console に `flexqstudio.com` を登録し、`/sitemap.xml` を送信する
- [ ] CTA のストア URL（App Store / Google Play）を設定する
      （`src/content/fallbacks.ts` の `cta.appStoreUrl` / `cta.googlePlayUrl` が現在 `null`。
      未設定の間もバッジは表示され、リンク先がページ内のダウンロード CTA へのアンカーになる）
- [ ] 公開後、実際に `https://flexqstudio.com/robots.txt` が `Allow: /` になっているか確認する

### 対応済み（2026-09-06）

- [x] Vercel に `flexqstudio.com` / `www.flexqstudio.com` を追加
- [x] ConoHa の A レコード 2 件を Vercel に向ける（MX / SPF / DKIM は変更なし）
- [x] TLS 証明書の自動発行を確認（apex / www とも HTTPS 200）
- [x] Production 環境変数 `NEXT_PUBLIC_SITE_URL` を設定して再デプロイ
- [x] `src/lib/site.ts` の `SITE_URL` 既定値を独自ドメインに変更
- [x] `src/app/sitemap.ts` を追加、`robots.txt` に `Sitemap:` 行を追加
- [x] `contact@flexqstudio.com` の受信を実機で確認
- [x] ConoHa の公開ディレクトリから動作確認用の `index.html` を削除

### 別途対応

- [ ] Node バージョンの不一致（`.nvmrc` は `22`、Vercel は `24.x`、`package.json` に `engines` 指定なし）。
      ローカルは `yarn install --ignore-engines` で回避している

---

## 5. トラブルシューティング

### 独自ドメインで「Forbidden」や古い内容が表示される

DNS 変更直後によく起きる。**ほぼ確実にローカルのキャッシュが原因**で、サイト側の問題ではない。

見分け方:

```bash
# 大元（権威 DNS）がどう答えるか
dig @ns-a1.conoha.io +short flexqstudio.com A     # 76.76.21.21 なら DNS は正しい

# ブラウザ・curl が実際に繋いでいる先
curl -s -o /dev/null -w "%{remote_ip}\n" https://flexqstudio.com/

# Vercel に IP を明示して接続（サイト自体が正常かの確認）
curl -sI --resolve "flexqstudio.com:443:76.76.21.21" https://flexqstudio.com/ | head -3
```

`dig` は新しい値なのに `curl` が `157.120.209.112` に繋いでいる場合、
OS / ブラウザのキャッシュが古い。`dig` は設定済み DNS サーバーに直接問い合わせるが、
ブラウザや curl は OS の名前解決キャッシュ（macOS では mDNSResponder）を経由するため差が出る。

対処:

```bash
# macOS の DNS キャッシュを消す
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

Chrome は独自の DNS キャッシュも持つため、`chrome://net-internals/#dns` の
「Clear host cache」を実行するか、Chrome を再起動する。
何もしなくても TTL（3600 秒）の経過で自動的に解消する。

> `server: nginx` + `Forbidden` / Apache 形式の 404 が返る場合は ConoHa に繋がっている。
> `server: Vercel` なら正しく Vercel に届いている。

### Preview URL が 302 で中身を取得できない

Vercel Authentication（デプロイ保護）が有効なため、匿名アクセスは SSO にリダイレクトされる。
ログイン済みのブラウザからは閲覧できる。

---

## 6. 検証用コマンド

```bash
# DNS が全ての権威サーバーに反映されているか
for ns in ns-a1.conoha.io ns-a2.conoha.io ns-a3.conoha.io; do
  echo "$ns  @=$(dig @$ns +short flexqstudio.com A)  www=$(dig @$ns +short www.flexqstudio.com A)"
done

# メール関連のレコードが無傷か
dig +short flexqstudio.com MX
dig +short flexqstudio.com TXT

# noindex が維持されているか
curl -s https://flexqstudio.com/robots.txt
curl -s https://flexqstudio.com/sitemap.xml
curl -s https://flexqstudio.com/ | grep -io '<meta name="robots"[^>]*>'

# canonical / OG が独自ドメインを指しているか
curl -s https://flexqstudio.com/ | grep -Eio '<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>'

# Vercel のドメイン設定
vercel domains inspect flexqstudio.com
```

---

## 関連ドキュメント

- `CLAUDE.md`「独自ドメイン（flexqstudio.com）」— DNS レコードの一覧
- `CLAUDE.md`「SEO / メタタグ」— metadata の置き場所と公開時の手順
- `CLAUDE.md`「ブランチ運用」「デプロイフロー」— マージとデプロイの規約
