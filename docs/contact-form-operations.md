# お問い合わせフォーム（/contact）の運用手順

開発者向けの手順書。フォームの構成、環境ごとの設定、運営者アカウントへの切り替え、公開、
キーの再発行、トラブル時の確認先をまとめる。運営者向けの案内は別文書
（Claude Docs「FlexQ お問い合わせフォームのご案内」）にある。

- **フォーム**: `src/app/contact/`・`src/components/contact/`（入力 → 入力確認 → 送信完了）
- **配送**: Notion 台帳に 1 行追加 → 運営者宛メール → 送信者宛メール（`src/lib/contactDelivery.ts`）
- **メール**: Amazon SES（`noreply@flexqstudio.com`）。開発中は開発者アカウント、本番は運営者アカウント
- **台帳**: Notion「FlexQ お問い合わせ管理 > お問い合わせ一覧」

---

## 1. 構成

```
利用者 ── /contact ──▶ Server Action（検証・スパム対策・回数制限）
                          ├ Notion 台帳に 1 行追加（添付も保存）
                          ├ 運営者宛メール: contact@flexqstudio.com（内容 + 添付・reply-to は送信者・台帳 URL 付き）
                          └ 送信者宛メール: 受付完了 + 入力内容の控え
```

- 台帳かメールのどちらかが成功すれば利用者には完了画面を出す。両方失敗したときだけエラーにする
- 送信者宛メールが失敗した場合は台帳の「控えメール未達」にチェックが付く
- 添付は保存せずメールと台帳に渡すだけ（上限は 1 ファイル 3MB・3 件・合計 4MB。Vercel の関数の本文上限 4.5MB に合わせている）
- スパム対策は外部サービスなし: ハニーポット、署名付きトークン（最小入力時間 3 秒・有効期限 12 時間）、配送済み同一内容の抑制、配送中の同一内容の集約、回数制限（IP 5 回 / 10 分・宛先 3 回 / 10 分・全体 60 回 / 時）、添付の先頭バイト検査
- 回数制限はメモリ上（Vercel のインスタンスをまたぐと効かない）。悪用が続く場合は Vercel Firewall のレート制限（`/contact` への POST）を追加する

主なファイルと環境変数の一覧は `CLAUDE.md` の「お問い合わせフォーム（/contact）」を参照。

---

## 2. 環境ごとの設定

| 環境 | 場所 | メール | 台帳 |
|------|------|--------|------|
| ローカル | `.env.local` | 開発者アカウントの SES（サンドボックス） | 本番と同じ台帳 |
| staging（Vercel Preview・`staging` ブランチ） | Vercel の Preview (staging) | 運営者アカウントの SES（切り替え前は開発者アカウント） | 本番と同じ台帳 |
| production | Vercel の Production | 運営者アカウントの SES | 本番と同じ台帳 |

台帳は 1 つを全環境で共有している。テスト行は件名で見分けて削除する。

### 環境変数

| 変数 | 値 | 備考 |
|------|----|------|
| `CONTACT_MAIL_PROVIDER` | `ses` | `resend` / `log` も可。`log` は送信せずログに出す |
| `AWS_SES_REGION` | `ap-northeast-1` | |
| `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY` | 送信専用 IAM ユーザーのキー | Vercel が予約する `AWS_ACCESS_KEY_ID` とは別名 |
| `CONTACT_FROM_EMAIL` | `FlexQ Contact <noreply@flexqstudio.com>` | 差出人名に丸括弧は使えない（メールの仕様でコメント扱いになり消える） |
| `CONTACT_TO_EMAIL` | 開発者アカウントの SES を使う間だけ | 運営者宛の受信先を上書き。運営者アカウントに切り替えたら削除する |
| `NOTION_TOKEN` | コネクト「FlexQ Contact Form」のトークン | 管理画面は `app.notion.com/developers/connections` |
| `NOTION_CONTACT_DATA_SOURCE_ID` | `4a2abac5-74d1-42d8-88eb-cc915ab70f0f` | 台帳「お問い合わせ一覧」の data source |
| `CONTACT_FORM_SECRET` | 環境ごとに別の値 | `openssl rand -hex 32` で生成 |

秘密情報（Notion のトークン、各環境の署名キー、運営者アカウントの送信キー）は開発者のパスワードマネージャーに保管する。
Vercel に登録した値は後から読み出せない。`.env.local.example` には実際の値を書かない。

### 開発者アカウントの SES（ローカル・切り替え前の staging）

- アカウント `140147588900`・サンドボックス（1 日 200 通・毎秒 1 通）。差出人も宛先も検証済みアドレスのみ
- 検証済み: 開発者の Gmail と `+flexqtest1` / `+flexqtest2` のエイリアス
- 送信専用 IAM ユーザー `flexq-web-contact-mail`（`ses:SendEmail` / `ses:SendRawEmail`・差出人固定）
- 差出人が Gmail のため、届いたメールに「amazonses.com 経由」と表示される（運営者アカウントに切り替えると消える）

---

## 3. 運営者アカウントの SES へ切り替える

運営者アカウント `195236889454` は SES の本番稼働アクセス承認済み（東京・1 日 50,000 通）、`flexqstudio.com` はドメイン検証済み（2026-10-07 確認）。
開発者が配信用に預かっている `flexq-deploy`（プロファイル `flexq-ops`）は管理者権限のため、IAM ユーザーの作成とキー発行を代行できる。
配信用の権限を別目的に使うので、運営者の了承を得てから行う。

### 3-1. スクリプトを実行する

```bash
cd lyrics-web-frontend
scripts/setup-contact-mail-ses.sh
```

スクリプトが行うこと:

1. 運営者アカウントであることと SES の状態を確認する
2. 送信専用 IAM ユーザー `flexq-web-contact-mail` を作成する（既にあれば再利用）
3. `ses:SendEmail` / `ses:SendRawEmail` のみ・差出人を `noreply@flexqstudio.com` に限定したインラインポリシーを付ける
4. アクセスキーを発行し、画面には出さずに `~/.flexq-web-contact-mail-key.json`（本人のみ読める権限）へ保存する
5. Vercel の Preview (staging) のキーと差出人を差し替え、`CONTACT_TO_EMAIL` を削除する
6. Vercel の Production に 8 件を登録する（署名キーは新規生成、Notion の値は `.env.local` から読む）

> IAM ユーザーの作成とキー発行は Claude Code の自動モードでは安全判定で止まるため、開発者がターミナルで実行する。
> ユーザーにアクセスキーが既に 2 本ある場合は失敗する。不要な方を削除してから再実行する。

### 3-2. 実行後

1. `~/.flexq-web-contact-mail-key.json` の内容をパスワードマネージャーに保存し、ファイルを削除する
2. Vercel を再デプロイして環境変数を反映する（環境変数は再デプロイまで反映されない）
   ```bash
   vercel redeploy https://flexq-web-git-staging-flexq-web.vercel.app
   ```
3. staging の `/contact` から、SES で検証していない外部アドレスを送信者欄に入れて添付付きで送信する
4. 受付完了メールの差出人が `noreply@flexqstudio.com` で「amazonses.com 経由」の表示が無いこと、迷惑メールに入っていないことを確認する
5. `contact@flexqstudio.com` に通知が届いたこと、Notion の台帳に行が増えて添付が開けることを確認する

staging の Preview は Vercel のログインで保護されており、`curl` や Playwright では確認できない。ブラウザで行う。

---

## 4. 公開

1. Notion の台帳からテスト行を削除し、「FlexQ お問い合わせ管理」ページ右上の「共有」から運営者を「編集可」で招待する
2. Production の環境変数が 8 件そろっていることを確認する（`vercel env ls production`）。未登録のまま公開すると本番の送信がエラーになる
3. `staging` から `master` への PR を作成してマージする（`CLAUDE.md` の「ブランチ運用」）
4. https://flexqstudio.com/contact から 1 件テスト送信し、2 通のメールと台帳を確認する
5. 運営者に `contact@flexqstudio.com` への到達を確認してもらい、テスト行を削除する

---

## 5. キーの再発行（漏えいの疑い・定期ローテーション）

1. 該当キーを無効化してから削除する
   ```bash
   AWS_PROFILE=flexq-ops aws iam list-access-keys --user-name flexq-web-contact-mail
   AWS_PROFILE=flexq-ops aws iam update-access-key --user-name flexq-web-contact-mail --access-key-id <ID> --status Inactive
   AWS_PROFILE=flexq-ops aws iam delete-access-key --user-name flexq-web-contact-mail --access-key-id <ID>
   ```
2. `scripts/setup-contact-mail-ses.sh` を再実行する（ユーザーとポリシーは再利用され、新しいキーが Vercel の staging と Production の両方に登録される）
3. **staging と本番の両方を再デプロイする。** Vercel の環境変数を更新しても稼働中のデプロイには反映されないため、本番を再デプロイしないと本番のメール送信が止まったままになる
   ```bash
   vercel redeploy https://flexq-web-git-staging-flexq-web.vercel.app   # staging
   vercel redeploy https://flexq-web-frontend.vercel.app                # 本番（flexqstudio.com と同じデプロイ）
   ```
4. staging と本番のそれぞれで 1 件テスト送信し、メール 2 通と台帳を確認する

キーを削除してから両環境の再デプロイが終わるまでメール送信は止まるが、台帳への記録は続くので問い合わせは失われない。
停止時間を短くしたい場合は、古いキーを削除する前にスクリプトで新しいキーを発行して再デプロイし、確認後に古いキーを削除する（IAM ユーザーはキーを 2 本まで持てる）。
Notion のトークンを作り直す場合は、コネクトの設定画面で再生成し、`.env.local` と Vercel の `NOTION_TOKEN` を差し替えて再デプロイする。

---

## 6. トラブルシューティング

| 症状 | 確認先 | 対処 |
|------|--------|------|
| 送信時に「送信に失敗しました」 | Vercel の Functions ログで `[contact]` の行 | キーの登録誤り・削除、ポリシーの差出人条件、SES の未検証アドレス（サンドボックス）を疑う |
| 通知メールは届くが台帳に行が無い | 運営者宛メール末尾の「台帳への記録に失敗」注記、Vercel のログ | トークン失効（コネクトの再生成・ページへの接続解除）か Notion 側の障害。メールの内容を手で転記する |
| 台帳には行があるが通知メールが届かない | 迷惑メールフォルダ、Vercel のログ | SES のバウンス・送信抑制を SES コンソールで確認 |
| 利用者に受付メールが届かない | 台帳の「控えメール未達」 | アドレスの入力誤りが多い。ドメイン指定受信の案内をする |
| 「送信が早すぎます」「有効期限が切れました」が出る | `CONTACT_FORM_SECRET` | 環境ごとに値が違うと署名が一致しない。表示直後の送信は仕様 |
| 「短時間に送信が集中しています」が出る | `contactGuard.ts` の `CONTACT_RATE_LIMITS` | 正当な利用で頻発するなら上限を見直す |
| 改行の多い本文で台帳への記録が失敗する | `contactNotion.ts` | 本文は 1 段落にまとめて Notion の 100 ブロック上限を回避している。回帰していないか確認 |

---

## 7. Strapi に移行する場合

CMS（Strapi）を復活させて問い合わせを Strapi に保存する場合も、入口は Server Action のまま（検証・スパム対策を Next.js 側に残す）にする。
`src/lib/contactNotion.ts` と同じ `ContactLedger` の形で Strapi へ投稿する実装を追加し、`src/lib/contactDelivery.ts` の `getContactDelivery` で差し替える。
移行期間は Notion と Strapi の両方に書き、Strapi 側の運用が回ることを確認してから Notion を止める。
