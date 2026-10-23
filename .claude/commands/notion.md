Notion の Web タスク管理操作を行うコマンドです。以下の操作に対応しています。

> Web（flexq-web-frontend）のタスクはモバイルアプリ（flexq-mobile・`TASK-X`）とは別のデータベースで管理する。このコマンドは Web 用 DB だけを対象にする。

## 設定

- データベース: 「FlexQ タスク管理 > Web タスク一覧」
- データベース URL: https://www.notion.so/7dc1d4159dd34470a0134049d63bb280
- データソース ID（MCP の `create-pages` / `query-data-sources` に渡す）: `collection://af4fd95e-1708-4b0d-a917-ca302418aa3c`
- ID の形式: `WEB-X`（ブランチ名は `feature/WEB-X-brief-description`、コミットタイトル末尾に `(WEB-X)`）

## 操作一覧

### タスク追加
「タスクを追加して」と伝えられたら以下を実行：
1. データベースの全タスクを取得し、ID プロパティの最大番号を確認して次の WEB-X を決定
2. `create-pages` でタスクを作成
3. ページ本文に `## 詳細` セクションを挿入

必須プロパティ:
- タイトル（title）
- ID（rich_text）: WEB-X 形式
- ステータス（status）: デフォルト "Not started"
- 優先度（select）: Low / Middle / High
- 簡単な詳細（rich_text）: 任意
- リリース（checkbox）: 作成時は OFF のまま

### ステータス更新
「WEB-X を〇〇にして」と伝えられたら以下を実行：
1. データベースをクエリして対象ページを取得
2. `update-page` でステータスを更新

ステータス値: "Not started" / "In progress" / "Done" / "Pending"

### リリースフラグ更新
「WEB-X をリリース済みにして」と伝えられたら以下を実行：
1. データベースをクエリして対象ページを取得
2. ステータスを "Done"、リリース（checkbox）を ON に更新

運用ルール: リリースフラグは「まだ本番（master）に出していない未リリース分」を示す。**develop → staging へマージして Vercel Preview（staging）で動作確認がとれた時点で ON** にし、**staging → master のリリース PR をマージした時点で OFF に戻す**（ステータスは Done のまま）。マージのみで動作確認が未了の場合は ON にしない。

### GitHub PR URL 登録
「WEB-X に PR URL を登録して」と伝えられたら以下を実行：
1. データベースをクエリして対象ページを取得
2. `update-page` で GitHub PR プロパティを更新

### ページ内容の追記・更新
「WEB-X に〇〇を追記して」「WEB-X の〇〇を修正して」と伝えられたら以下を実行：
1. データベースをクエリして対象ページを取得
2. `update-page` で本文を追記・更新する

## 実装ルール

- Notion MCP ツール（`mcp__notion__*`）を使う。ページ取得は `fetch`、検索は `search`（`data_source_url` で Web タスク一覧に絞る）、更新は `update-page`、作成は `create-pages`
- 最大 ID の確認は `query-data-sources` の SQL モード（`ORDER BY CAST(SUBSTR("userDefined:ID", 5) AS INTEGER) DESC LIMIT 1`）で行う。プラン制限で使えない場合は `search` / `fetch` で代替する
- MCP が利用できない場合は curl で Notion REST API（`https://api.notion.com/v1`）を直接呼び出す。API トークンはユーザーに確認する
