# FlexQ Web 動作確認テスト

プロモーションサイト（https://flexqstudio.com）の動作確認ケース集です。画面・機能ごとにケースを分けています。
アプリ（flexq-mobile）の `docs/test-cases.md` と同じ運用で、**このファイルを正**として E2E（Playwright）の
テストとケース ID を 1 対 1 で対応させています。

## はじめに

### 区分（自動 / 手動）

| 区分 | 意味 |
|------|------|
| **自動** | E2E（Playwright・`e2e/*.spec.ts`）で確認する。テスト名の先頭がケース ID（例: `TP-01 ヒーローに…`）。PR ごとに GitHub Actions（`.github/workflows/ci.yml`）で実行される |
| **手動** | 人がブラウザ・実機で確認する。見た目や動きの質、外部サービス（SES・Notion・Strapi・SNS）が絡むもの、Vercel の Preview / 本番でしか確かめられないもの |

- 「E2E」列は対応する spec ファイル。`（PC のみ）` / `（SP のみ）` は Playwright の `desktop`（Desktop Chrome）/ `mobile`（iPhone 14 ビューポート）プロジェクトのどちらで検証するかを表し、もう一方ではスキップになる
- 自動ケースにも手順と期待結果を書いている。E2E が落ちたときに、何を確かめるテストなのかを人が追えるようにするため
- **ケースを追加・変更したら、対応する spec のテスト名（ID）も揃える。** spec にないテスト・ID のない自動ケースは残さない（README 用の素材を作る `features-linebreak.spec.ts` の `@record` タグ付きテスト 2 本だけは検証ではないため例外。通常の `yarn e2e` / CI では実行されない）

### 実行方法

```bash
yarn build && yarn e2e                         # 全ケース（desktop / mobile）
npx playwright test --grep @CT                 # セクション単位（describe のタグ = セクション ID）
npx playwright test --grep "CT-04 "            # ケース単位
```

### 前提条件（特記のないケース共通）

- **Strapi（CMS）は接続していない状態**を基準にする。本番は CMS 休止中（2026-08-15 決定）で、トップページはフォールバック文言（`src/content/fallbacks.ts`）で描画され、NEWS / LEARN セクションと記事への導線は出ない
- Strapi に依存するケースは「Strapi 稼働時」と明記している。自動ケースは Strapi の有無どちらでも成立するように書いてあり、成立しない側はスキップになる（ER-02 / ER-03 はどちらか一方が必ずスキップ）
- 自動ケースはローカル（または CI）の本番ビルド（`yarn build` → `yarn start`）に対して実行する。Vercel の Preview（staging）は Vercel Authentication で保護されていて Playwright・`curl` から開けないため、staging での確認は手動になる
- 一般公開前（`src/lib/site.ts` の `ALLOW_INDEXING = false`）の出力を正とする。公開時の確認は SE-09

### ライブラリ更新時に staging で最低限見るケース（★）

区分に **★** が付いたケースは、依存ライブラリを更新したときに staging の Preview
（https://flexq-web-git-staging-flexq-web.vercel.app）で最低限目視するケースです。
自動ケースも CI とは別に staging で開いて確認します（CI はローカルの本番ビルドで、Vercel のビルド・配信までは検証しないため）。
所要 15 分ほど。PC（Chrome）と SP（実機の iPhone Safari か Android Chrome）の両方で見ます。

1. CI（GitHub Actions）の E2E が全件通っていること
2. ★ のケース: TP-01 / TP-02 / TP-07 / NV-01 / NV-03 / FQ-01 / ER-01 / ER-03 / CT-01 / CT-04 / LG-01 / LG-02 / RS-03 / FX-01 / FX-07 / RL-01 / RL-02
3. 更新したライブラリに応じて、次のケースも追加で見る

| 更新したもの | 追加で見るケース |
|-------------|----------------|
| `next` / `react` / `react-dom` | ER-04 / FX-08 / NV-08、お問い合わせの送信（CT-08。Server Action が変わるため） |
| `three` / `@react-three/fiber` / `@react-three/drei` | FX-06 / FX-07（FX-07 は実機の SP でも） |
| `lenis` | NV-08 / TP-03 / FX-01（トラックパッドとマウスホイールの両方） |
| `tailwindcss` / `@tailwindcss/postcss` / `tw-animate-css` | FX-03 / FX-09 / FQ-05 / RS-04 |
| `@aws-sdk/client-sesv2` / `nodemailer` / `@notionhq/client` | CT-08 / CT-09（実送信。テスト行は台帳から削除する） |
| `@strapi/blocks-react-renderer` | AR-04（ローカルで Strapi を起動して確認） |
| `@playwright/test` | `yarn e2e` が全件通ること（ブラウザの再取得が必要なら `npx playwright install chromium`） |

本番へ反映したあとは RL-03 を行います。

### 結果の報告方法

- 各ケースの「期待される結果」と違う動きをしたら **NG** です
- NG の場合は「**ケース番号**（例: CT-04）+ 確認した環境（ブラウザ・端末・URL）+ 実際に起きたこと + 可能ならスクリーンショット / 画面録画」を残してください
- 自動ケースが CI で落ちた場合は、Actions のアーティファクト（`playwright-report` / `test-results`）にトレースとスクリーンショットが残ります

---

## 1. トップページ（TP）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| TP-01 | ヒーローの表示 | — | `/` を開く | 画面いっぱいのキービジュアルの中央に FlexQ のロゴ（画像名「FlexQ」）と、その下にタグライン（既定は「YOUR MUSIC. YOUR WORDS.」）が表示される。下端に「SCROLL」のインジケーターがある | 自動 ★ | `top-page.spec.ts` |
| TP-02 | 主要セクションの描画 | — | `/` を開いて最後までスクロールする | HERO → STATEMENT（WRITE / RECORD / PLAY）→ 3 CORE FEATURES（既定はカード 3 枚: 01 — CUE / 02 — REC / 03 — WRITE）→ APP PREVIEW → FAQ → ダウンロード CTA → フッターの順に表示される | 自動 ★ | `top-page.spec.ts` |
| TP-03 | SCROLL インジケーター | — | ヒーロー下端の「SCROLL」をクリックする | STATEMENT セクションまでなめらかにスクロールし、URL の末尾が `#statement` になる | 自動 | `top-page.spec.ts` |
| TP-04 | 3 CORE FEATURES の見出しの改行 | — | 画面幅を 1023px / 768px / 375px / 320px と 1024px にして見出しを見る | 1023px 以下では 3 枚とも読点の直後で改行される（「作りたい場所へ、/ ワンタップ。」「思いついた瞬間、/ そのまま録る。」「聴きながら、/ そのまま書く。」）。1024px 以上は読点ごとの区切り（inline-block）が外れ、`text-wrap: balance` に任せる（折り返し位置は日本語フォントに左右されるため E2E では位置ではなく balance が効いていることを確認する。macOS の Chrome では 1 枚目が「作りたい場所 / へ、ワンタップ。」になる） | 自動 | `features-linebreak.spec.ts`（PC のみ。幅を直接変えて検証） |
| TP-05 | APP PREVIEW（SP）のドット | SP の幅（768px 未満） | APP PREVIEW までスクロールし、カルーセル下の 2 つ目のドット（既定は PROJECT EDITOR）をタップする | 横スクロールでその画面が中央に来て、キャプションがゴールド・ドットが点灯する。最初は先頭（既定は PROJECT LIST）がアクティブ。指で横にスワイプしても 1 台ずつ中央で止まる | 自動 | `top-page.spec.ts`（SP のみ） |
| TP-06 | APP PREVIEW（PC）の自動カルーセル | PC の幅（768px 以上） | APP PREVIEW を開いたまま 20 秒ほど待つ | 最初は PROJECT EDITOR が中央でアクティブ（ゴールドの枠・1.3 倍）。6 秒ごとに右から左へ 1 台ずつ送られ、4 台を一巡しても途切れず（逆走せず）流れ続ける。各画面の動画（画面収録）は音なしでループ再生され、左右の端は徐々に透明になる | 手動 | — |
| TP-07 | ダウンロード CTA のストアボタン | — | ページ下部のダウンロード CTA を見て、各ボタンをクリックする | 「App Store からダウンロード」「Google Play で手に入れよう」の公式バッジが 2 つ並ぶ（幅が狭いと縦に並ぶ）。ストア URL が未設定の間（現状）はクリックしても CTA 自身（`/#download`）に留まる。URL 設定後は新しいタブでストアが開く | 自動 ★ | `top-page.spec.ts` |
| TP-08 | CMS 未接続時の NEWS / LEARN | Strapi 未接続 | `/` を開き、ヘッダーとフッターのナビを見る | NEWS / LEARN & READ セクションは表示されず、ナビにも NEWS / LEARN のリンクが出ない（FEATURES / PREVIEW / FAQ は常に表示）。Strapi 稼働中で記事がある場合はセクションとナビのリンクが両方表示される（AR-05） | 自動 | `top-page.spec.ts` |
| TP-09 | フッター | — | ページ最下部のフッターを見る | ロゴ、ナビ（FEATURES / PREVIEW / FAQ）、PRIVACY POLICY / TERMS / CONTACT のリンク、`© <今年> FlexQ`、Apple / Google の商標表記（「…App Store は、米国および他の国々で登録された Apple Inc. の商標です。Google Play および Google Play ロゴは Google LLC の商標です。」）が表示される | 自動 | `top-page.spec.ts` |

## 2. ナビゲーション / SP メニュー（NV）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| NV-01 | PC ナビからセクションへ移動 | PC の幅 | ヘッダーの FEATURES をクリックする（PREVIEW / FAQ も同様） | 該当セクションまでなめらかにスクロールし、URL の末尾が `#features` などに変わる | 自動 ★ | `navigation.spec.ts`（PC のみ） |
| NV-02 | ヘッダーの DOWNLOAD | — | ヘッダーの DOWNLOAD（PC はナビ右端、SP はハンバーガーの左）をクリックする | ダウンロード CTA までスクロールし、URL の末尾が `#download` になる | 自動 | `navigation.spec.ts` |
| NV-03 | SP メニューを開いてリンクで移動 | SP の幅 | ハンバーガー（3 本線）をタップ → メニュー内の FAQ をタップする | 全画面のメニューがフェードで開き、ロゴ・× ボタン・ナビ・ストアボタンが並ぶ。FAQ をタップするとメニューが閉じて FAQ セクションが表示される | 自動 ★ | `mobile-menu.spec.ts`（SP のみ） |
| NV-04 | SP メニューを × で閉じる | SP の幅 | メニューを開いて右上の × をタップする | メニューがフェードで閉じ、元のスクロール位置のまま | 自動 | `mobile-menu.spec.ts`（SP のみ） |
| NV-05 | SP メニューのストアボタン | SP の幅 | メニューを開いて下部を見る | App Store / Google Play のバッジが縦に並んで表示される | 自動 | `mobile-menu.spec.ts`（SP のみ） |
| NV-06 | サブページからトップのセクションへ | — | `/terms` を開き、ヘッダーの FAQ（SP はメニュー内の FAQ）をクリックする | トップページへ遷移し、FAQ セクションが表示される（URL は `/#faq`） | 自動 | `navigation.spec.ts` |
| NV-07 | サブページのロゴでトップへ | — | `/privacy-policy` を開き、ヘッダー左のロゴをクリックする | トップページ（`/`）に戻る。サブページでは SP でもヘッダーにロゴが表示される（トップの SP ではヒーローの大ロゴと重なるため出さない。RS-01） | 自動 | `navigation.spec.ts` |
| NV-08 | 戻る / 進む | PC（トラックパッドかマウスホイール） | トップでナビから FAQ へ移動 → ブラウザの「戻る」→「進む」。続けて `/terms` へ移動して「戻る」 | 「戻る」でアンカー移動前の位置に、「進む」で FAQ の位置に戻る。慣性スクロールの残りで勝手に動き続けない。`/terms` から戻るとトップのスクロール位置が復元される | 手動 | — |

## 3. FAQ（FQ）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| FQ-01 | 開閉 | — | FAQ の 1 つ目の質問をクリック → もう一度クリックする | 1 回目で回答が開き（＋ が × に回転し、連番と質問がゴールドになる）、2 回目で閉じる。閉じている回答は見えず、Tab キーでのフォーカスや読み上げの対象にもならない（`inert`） | 自動 ★ | `faq.spec.ts` |
| FQ-02 | 複数同時に開く | — | 1 つ目と 2 つ目の質問を続けてクリックする | 両方とも開いたままになる（片方を開くともう片方が閉じる動きではない） | 自動 | `faq.spec.ts`（FAQ が 1 件以下ならスキップ） |
| FQ-03 | キーボード操作 | — | Tab キーで質問にフォーカスし、Enter → Space を押す | Enter で開き、Space で閉じる。フォーカス中は質問の行にゴールドの枠線が出る | 自動 | `faq.spec.ts` |
| FQ-04 | 回答内のリンク | — | 「不具合や要望はどこに連絡すればよいですか？」を開き、「お問い合わせフォームへ →」をクリックする | `/contact` に移動してお問い合わせフォームが表示される | 自動 | `faq.spec.ts`（CMS の FAQ はリンクを持たないため、Strapi の FAQ が使われている間はスキップ） |
| FQ-05 | 開閉・hover の演出 | PC | 質問にマウスを乗せる → クリックで開閉する | hover でゴールドの帯が左から右へ走り、連番の輪郭がゴールドになる。開くと高さがなめらかに伸び、左端にゴールドの縦線が伸びて回答がフェードインする。閉じるときも途中で引っかからない。Safari でも高さがアニメーションする | 手動 | — |

## 4. 記事一覧・詳細（AR）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| AR-01 | NEWS 一覧 → 詳細 → 一覧 | — | `/news` を開き、記事があれば 1 件目 → 「NEWS 一覧へ」をクリックする | 見出し NEWS の一覧が表示される。記事がなければ「まだお知らせはありません。」。記事があれば詳細が開き、「NEWS 一覧へ」で `/news` に戻る | 自動 | `articles.spec.ts` |
| AR-02 | TUTORIAL 一覧 | — | `/tutorials` を開く | 見出し TUTORIAL の一覧が表示される。記事がなければ「まだチュートリアルはありません。」。難易度を設定した記事には BEGINNER / INTERMEDIATE / ADVANCED のバッジが付く | 自動 | `articles.spec.ts` |
| AR-03 | COLUMN 一覧 → 詳細 | — | `/columns` を開き、記事があれば 1 件目をクリックする | 見出し COLUMN の一覧が表示される。記事がなければ「まだコラムはありません。」。記事があれば詳細が開く | 自動 | `articles.spec.ts` |
| AR-04 | 記事詳細の中身 | Strapi 稼働時（ローカルで `lyrics-web-strapi` を起動） | NEWS / TUTORIAL / COLUMN の記事詳細をそれぞれ開く | タイトル・日付・カテゴリ（TUTORIAL は難易度）・本文（見出し・リスト・リンク・画像などのリッチテキスト）・著者が崩れずに表示される。下部の「〇〇 一覧へ」で一覧に戻れる | 手動 | — |
| AR-05 | トップの NEWS / LEARN セクション | Strapi 稼働時・記事あり | `/` を開く | NEWS（カード）と LEARN & READ（TUTORIAL / COLUMN の行）が FAQ の上に表示され、ナビにも NEWS / LEARN が出る。各「VIEW ALL →」で一覧ページへ移動できる | 手動 | — |

## 5. 404 / エラー（ER）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| ER-01 | 存在しない URL | — | `/no-such-page` を開き、「BACK TO TOP」をクリックする | HTTP 404 で、「404」「PAGE NOT FOUND」「お探しのページは見つかりませんでした。」が表示される。「BACK TO TOP」でトップへ戻る | 自動 ★ | `errors.spec.ts` |
| ER-02 | 存在しない記事（Strapi 稼働時） | Strapi 稼働時 | `/news/no-such-article` を開く | ER-01 と同じ 404 ページ（PAGE NOT FOUND）が表示される。※ ルートの `loading.tsx` によるストリーミング配信のため HTTP ステータスは 200 になる | 自動 | `errors.spec.ts`（Strapi 未起動ならスキップ） |
| ER-03 | CMS 停止中の記事詳細 | Strapi 未接続（本番の現状） | `/news/no-such-article` を開き、「BACK TO TOP」をクリックする | 404 ではなくエラーページ（「ERROR」「PAGE COULD NOT BE LOADED」「ページを表示できませんでした。時間をおいて再度お試しください。」）が表示される。CMS の一時障害で実在する記事まで 404 と誤判定しないための仕様。「再読み込み」で取り直し、「BACK TO TOP」でトップへ戻る（Next.js 既定の英語のエラー画面にならない） | 自動 ★ | `errors.spec.ts`（Strapi 稼働中ならスキップ） |
| ER-04 | 遷移中のローディング | 回線が遅い環境（DevTools の Network を Slow 4G など） | トップから記事一覧・規約などへ移動する | 表示までの間、ゴールドの光が波形の上を走るローディング（「LOADING」）が表示され、白い画面やレイアウト崩れが出ない | 手動 | — |

## 6. お問い合わせ（CT）

自動ケースは「入力確認」→「修正する」までを確認し、**「送信する」は押しません**（ローカルの `.env.local` に SES / Notion の値が入っていると実際に配送されるため）。実送信は CT-08〜CT-10 で手動確認します。設定・切り替え・トラブル時の確認先は `docs/contact-form-operations.md` を参照してください。

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| CT-01 | 入力フォームの初期表示 | — | `/contact` を開く | 見出し CONTACT の下に、お問い合わせの目的（プルダウン。「選択してください」+ 6 項目: アプリの使い方について / 不具合の報告 / 機能の要望 / アカウント・データについて / 取材・掲載・提携について / その他）、メールアドレス、お問い合わせ内容（以上 3 つに「必須」）、添付ファイル（「任意」・ドロップ領域と「ファイルを選択」）が並ぶ。「入力確認」は押せない。下部に `contact@flexqstudio.com`（mailto）への案内がある。スパム対策の隠し欄は画面に見えない | 自動 ★ | `contact.spec.ts` |
| CT-02 | 入力確認ボタンの活性 | — | 目的 → メール → 本文の順に入力し、途中と最後でボタンを見る。本文を空白・改行だけにする / メールを消す | 3 項目すべてに入力があるときだけ「入力確認」が押せる。空白・改行だけの本文は未入力扱い | 自動 | `contact.spec.ts` |
| CT-03 | メールアドレスの形式エラー | — | メール欄に `e2e-test@example`（ドットのないドメイン）を入れて「入力確認」→ 正しいアドレスに直す | 「メールアドレスの形式が正しくありません。」が赤字で表示され、確認画面に進まない。入力し直すとエラーが消える | 自動 | `contact.spec.ts` |
| CT-04 | 入力確認と修正 | — | 3 項目を入力して「入力確認」→「修正する」 | 確認画面に切り替わって画面の先頭（「以下の内容で送信します。…」）が表示され、目的・メール・本文（改行を保持）・添付（なしなら「なし」）が並ぶ。「修正する」で入力値を保ったまま入力フォームに戻る | 自動 ★ | `contact.spec.ts` |
| CT-05 | 本文の文字数 | — | 本文を入力する | 右下に「入力文字数 / 2000」が表示され、2000 文字を超えて入力できない | 自動 | `contact.spec.ts` |
| CT-06 | 添付ファイルの追加・削除 | — | PNG を 1 つ選ぶ（またはドロップ）→ 確認画面で表示を見る →「修正する」→ × で削除する | ファイル名とサイズが一覧に出て、確認画面にもファイル名が表示される。× で一覧から消える。同じファイルを選び直せる | 自動 | `contact.spec.ts` |
| CT-07 | 添付ファイルの制限 | — | .txt を選ぶ / 3 MB を超える PNG を選ぶ / 4 ファイルまとめて選ぶ / 3 ファイル選ぶ | それぞれ「「note.txt」は添付できない形式です。PNG / JPG / PDF のみ添付できます。」「「large.png」のサイズが上限（3 MB）を超えています。」「添付できるファイルは 3 件までです。」と表示されて追加されない。3 件そろうと「ファイルを選択」が押せなくなる。※ 合計 4 MB の上限もある | 自動 | `contact.spec.ts` |
| CT-08 | 実送信（台帳とメール 2 通） | staging（または本番の公開直後）。件名・本文に「テスト」と分かる内容を入れる | 入力 → 入力確認 →「送信する」 | ボタンが「送信中…」になったあと「送信が完了しました」の画面に変わる。① Notion「FlexQ お問い合わせ管理 > お問い合わせ一覧」に 1 行増える（ステータス: 新着）② `contact@flexqstudio.com` に内容入りの通知が届く（返信先は送信者・台帳の URL 付き）③ 入力したアドレスに受付完了メール（入力内容の控え）が届く。差出人は `noreply@flexqstudio.com`。確認後、台帳のテスト行を削除する | 手動 ★（※） | — |
| CT-09 | 添付付きの実送信 | CT-08 と同じ | PNG / JPG / PDF を添付して送信する | 運営者宛のメールと台帳の行に添付が付き、開ける。受付完了メールに添付は付かない（ファイル名の控えのみ） | 手動 | — |
| CT-10 | 送信時のエラー表示 | staging | ページを開いてすぐ（3 秒以内）に送信する / 本文を毎回変えて、同じアドレスで 10 分以内に 4 回送信する（同じ内容の再送は連投として黙って成功扱いになるため） | それぞれ「送信が早すぎます。内容をご確認のうえ、もう一度「送信する」を押してください。」、4 回目に「短時間に送信が集中しています。しばらく時間をおいてから、もう一度お試しください。」が確認画面に表示され、入力内容は残ったまま再送できる。通信を切って送信すると「通信に失敗しました。…」になる | 手動 | — |

※ CT-08 はお問い合わせに関わるライブラリ（`next` / `@aws-sdk/client-sesv2` / `nodemailer` / `@notionhq/client`）を更新したときだけ ★ の対象にする。

## 7. 規約 / プライバシー（LG）

Google OAuth の同意画面（アプリのログイン）から参照される公開 URL です。

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| LG-01 | 利用規約 | — | `/terms` を開いて最後までスクロールする | 見出し TERMS OF SERVICE の下に前文と第1条（適用）〜第13条（お問い合わせ）の 13 条、`contact@flexqstudio.com`（mailto）、「制定日: 2026年8月15日」、「← トップへ戻る」が表示される | 自動 ★ | `legal.spec.ts` |
| LG-02 | プライバシーポリシー | — | `/privacy-policy` を開いて最後までスクロールする | 見出し PRIVACY POLICY の下に前文と第1条（収集する情報）〜第11条（お問い合わせ）の 11 条、`contact@flexqstudio.com`（mailto）、「制定日: 2026年8月15日」が表示される | 自動 ★ | `legal.spec.ts` |
| LG-03 | フッターからの移動 | — | トップのフッターで PRIVACY POLICY / TERMS / CONTACT をそれぞれクリックする | `/privacy-policy` / `/terms` / `/contact` に移動し、それぞれの見出しが表示される | 自動 | `legal.spec.ts` |
| LG-04 | トップへ戻る | — | `/terms` の最下部の「← トップへ戻る」をクリックする | トップページ（`/`）に戻る | 自動 | `legal.spec.ts` |
| LG-05 | 本番 URL への到達 | 本番 | https://flexqstudio.com/privacy-policy と https://flexqstudio.com/terms を開く（アプリの Google ログインの同意画面からのリンクでも確認する） | どちらも 200 で表示される（URL を変えると同意画面のリンクが切れるため変更しない） | 手動 | — |

## 8. SEO / OGP（SE）

表示幅に依存しないため、自動ケースは desktop プロジェクトだけで実行します。ドメイン部分は `NEXT_PUBLIC_SITE_URL`（未設定時は `https://flexqstudio.com`）で決まります。

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| SE-01 | robots.txt | 一般公開前 | `/robots.txt` を開く | `User-Agent: *` / `Disallow: /` だけを返す（`Allow` と `Sitemap` はない） | 自動 | `seo.spec.ts`（PC のみ） |
| SE-02 | sitemap.xml | 一般公開前 | `/sitemap.xml` を開く | 200 で、`<url>` を 1 つも含まない空の `<urlset>` を返す（未公開ページの一覧を晒さない） | 自動 | `seo.spec.ts`（PC のみ） |
| SE-03 | noindex | 一般公開前 | `/` `/news` `/tutorials` `/columns` `/terms` `/privacy-policy` `/contact` のソースを見る | すべて `<meta name="robots" content="noindex, nofollow, nocache">` が入っている | 自動 | `seo.spec.ts`（PC のみ） |
| SE-04 | title / description / canonical / OGP | — | SE-03 の各ページのソースを見る | title はサブページが「NEWS \| FlexQ」のように「画面名 \| FlexQ」、トップは「FlexQ — YOUR MUSIC. YOUR WORDS.」。description があり、canonical と `og:url` がそのページの絶対 URL（トップは末尾スラッシュなし）、`og:title` = title、`og:description` = description、`og:type` website・`og:locale` ja_JP・`og:site_name` FlexQ、`og:image` / `twitter:image` が `/og.png`、`twitter:card` が summary_large_image | 自動 | `seo.spec.ts`（PC のみ） |
| SE-05 | OG 画像 | — | `/og.png` を開く | 1200x630 の PNG が表示される | 自動 | `seo.spec.ts`（PC のみ） |
| SE-06 | 構造化データ | — | `/` のソースの `application/ld+json` を見る（[リッチリザルトテスト](https://search.google.com/test/rich-results) でも可） | `@graph` に Organization / WebSite / MobileApplication の 3 つがあり、アプリは無料（`offers.price` が "0"） | 自動 | `seo.spec.ts`（PC のみ） |
| SE-07 | SNS でのシェア表示 | 本番 | トップと `/contact` の URL を X・LINE・Facebook（[シェアデバッガー](https://developers.facebook.com/tools/debug/)）に貼る | OG 画像・タイトル・説明文のカードが表示される。サブページは「CONTACT \| FlexQ」などページごとのタイトルになる | 手動 | — |
| SE-08 | 記事詳細の meta | Strapi 稼働時 | 記事詳細のソースを見る | title が記事の SEO タイトル +「 \| FlexQ」、`og:type` が article、canonical が記事の URL、description が記事の SEO 説明文（未設定なら抜粋） | 手動 | — |
| SE-09 | 一般公開時の出力 | `ALLOW_INDEXING = true` にした本番（リリース手順は README の「一般公開時にやること」） | 本番の `/robots.txt` `/sitemap.xml` とトップのソースを見る | robots.txt が `Allow: /` + `Sitemap:`、sitemap.xml に固定ページ（+ 記事）の URL が並び、meta robots が index, follow になる。Preview（staging）は公開後も noindex のまま | 手動 | — |

## 9. レスポンシブ（RS）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| RS-01 | ヘッダーの切り替え | — | PC の幅と SP の幅でトップと `/terms` を開く | PC（768px 以上）はテキストのナビ + DOWNLOAD、SP はハンバーガー + DOWNLOAD。SP のトップだけヘッダーのロゴを出さない（サブページは出す） | 自動 | `responsive.spec.ts` |
| RS-02 | 横スクロールが出ない | — | `/` `/news` `/terms` `/privacy-policy` `/contact` を PC / SP の幅で開く | どのページも横方向にはみ出さない（横スクロールバーが出ない・左右に揺れない） | 自動 | `responsive.spec.ts` |
| RS-03 | 実機ブラウザでの表示 | staging または本番 | iPhone Safari / Android Chrome / PC Chrome / PC Safari でトップ・`/contact`・`/terms` を開いてスクロールする | レイアウトが崩れず、文字の重なり・はみ出し・画像の歪みがない。iPhone ではアドレスバーの伸縮でヒーローが大きく跳ねない | 手動 ★ | — |
| RS-04 | 境界幅 | PC | ブラウザの幅を 1440px → 320px までゆっくり狭め、また広げる | 768px（PC ナビ ↔ ハンバーガー、APP PREVIEW の PC ↔ SP）と 1024px（見出しの折り返し）の前後で崩れない。SP メニューを開いたまま 768px 以上に広げるとメニューが消える | 手動 | — |

## 10. 演出（FX）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| FX-01 | 慣性スクロール（Lenis） | PC（トラックパッドとマウスホイール） | トップをスクロールし、途中で止める | なめらかに慣性が付き、カクつかない。ページ最下部まで届く（FAQ を開いて高さが変わっても下端が切れない）。お問い合わせの本文欄・SP の APP PREVIEW の上ではその要素自体がスクロールする。タッチ操作（SP）は OS 標準のまま | 手動 ★ | — |
| FX-02 | リビールの発火 | — | トップを開き、FAQ までスクロールする | 画面外の見出し・本文は最初は非表示で、画面に入ると表示される（一度表示されたら戻らない） | 自動 | `effects.spec.ts` |
| FX-03 | リビールの見た目 | PC | トップを上から順にスクロールする | 各セクションの見出し・本文・カードが下から上へフェードインし、罫線が左から伸びる。カードや FAQ の行は少しずつ時間差で現れる。hover の動きと干渉しない | 手動 | — |
| FX-04 | 動きを減らす設定 | OS の「視差効果を減らす」/「アニメーションを削除」を ON（DevTools の Rendering で `prefers-reduced-motion: reduce` でも可） | トップを開く | リビールせず最初からすべて表示される。慣性スクロール・ページ遷移のフェード・hover の移動も止まる | 自動 | `effects.spec.ts`（リビールのみ自動。他は目視） |
| FX-05 | JavaScript 無効 | ブラウザの JavaScript を無効にする | トップを開く | リビール対象も含めてコンテンツが表示される（`layout.tsx` の `<noscript>` スタイル） | 自動 | `effects.spec.ts` |
| FX-06 | キービジュアルの描画 | — | トップを開く | ヒーロー全面に WebGL のキャンバスが描画され、ページのエラー（コンソールの未処理例外）が出ない | 自動 | `effects.spec.ts` |
| FX-07 | キービジュアルの見た目 | PC と実機の SP | トップを開いてしばらく眺め、ブラウザの幅を変える | 紫とゴールドの波紋・波形・グリッチが動き続け、黒画面・真っ白・極端なカクつきにならない。幅を変えるとすぐ全面に追従する（引き伸ばし・余白が出ない）。SP で発熱・著しい電池消費がない | 手動 ★ | — |
| FX-08 | ページ遷移のフェード | — | トップからフッターの TERMS へ移動し、ブラウザで戻る | 移動前の画面が短くフェードアウトし、次の画面がフェードインする。ページ内アンカー・新しいタブで開くリンクではフェードしない | 手動 | — |
| FX-09 | hover の演出 | PC | DOWNLOAD・ストアバッジ・ナビのリンク・FEATURES のカードにマウスを乗せる | ボタンは光が走って少し浮き、ナビのリンクは下線が伸びてゴールドになる。カードは浮き上がる。マウスを外すと元に戻る | 手動 | — |

## 11. リリース確認（RL）

| No | 確認すること | 前提条件 | 手順 | 期待される結果 | 区分 | E2E |
|----|----|----|----|----|----|----|
| RL-01 | staging の Preview | `develop` → `staging` をマージ・push 済み | `vercel ls flexq-web` で state が READY になってから https://flexq-web-git-staging-flexq-web.vercel.app をログイン済みのブラウザで開き、トップ・`/contact`・`/terms`・`/privacy-policy` を PC / SP の幅で見る | 変更した画面が意図どおり表示され、DevTools のコンソールにエラーが出ていない | 手動 ★ | — |
| RL-02 | staging の noindex | RL-01 と同じ | staging のトップでページのソースを表示する | `<meta name="robots" content="noindex, …">` が入っている（Preview は一般公開後も noindex） | 手動 ★ | — |
| RL-03 | 本番反映後 | `staging` → `master` をマージ済み | 次のコマンドを実行し、本番のトップをブラウザで開く: `curl -s -o /dev/null -w "%{http_code}\n" https://flexqstudio.com/` / `curl -s https://flexqstudio.com/robots.txt` / `curl -s https://flexqstudio.com/ \| grep -io '<meta name="robots"[^>]*>'` | 200 が返り、robots.txt と meta robots が公開状態に応じた内容（公開前は Disallow / noindex）。変更が本番に反映されている（古い内容が見える場合は `docs/custom-domain-and-release.md` のトラブルシューティング） | 手動 | — |

---

*このドキュメントはサイトの更新に合わせて改訂されます。最終更新: 2026-10-23*
