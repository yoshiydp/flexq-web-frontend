import { expect, test, type Page } from "@playwright/test";

import { waitForHydration } from "./helpers";

/**
 * お問い合わせフォーム（docs/test-cases.md「6. お問い合わせ（CT）」）。
 *
 * 入力 → 入力確認 → 修正 までを検証し、「送信する」は押さない（実送信は CT-08〜CT-10 の手動確認）。
 * ローカルの .env.local に SES / Notion の値が入っていると実際に配送されてしまうため、
 * E2E から Server Action の送信を呼ばないことをこのファイルの前提にする。
 */

const SUBJECT = "不具合の報告";
const EMAIL = "e2e-test@example.com";
const MESSAGE = "E2E テストの本文です。\n2 行目です。";

/** 1x1 の透過 PNG（先頭バイト検査を通る実データ） */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const png = (name: string, buffer: Buffer = PNG_1PX) => ({
  name,
  mimeType: "image/png",
  buffer,
});

function form(page: Page) {
  return {
    // Next.js のルートアナウンサー（role="alert"）と区別するため main に絞る
    alert: page.getByRole("main").getByRole("alert"),
    subject: page.getByLabel("お問い合わせの目的"),
    email: page.getByLabel("メールアドレス"),
    message: page.getByLabel("お問い合わせ内容"),
    files: page.locator('input[type="file"][name="attachments"]'),
    pickFiles: page.getByRole("button", { name: "ファイルを選択" }),
    confirm: page.getByRole("button", { name: "入力確認" }),
  };
}

async function fillValid(page: Page) {
  const f = form(page);
  await f.subject.selectOption(SUBJECT);
  await f.email.fill(EMAIL);
  await f.message.fill(MESSAGE);
}

test.describe("CT お問い合わせ", { tag: "@CT" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "CONTACT" })).toBeVisible();
    // 制御コンポーネントのため、ハイドレーション前の入力は React に拾われない
    await waitForHydration(form(page).confirm);
  });

  test("CT-01 入力フォームの初期表示", async ({ page }) => {
    const f = form(page);
    await expect(
      page.getByRole("group", { name: "入力フォーム" }),
    ).toBeVisible();
    await expect(f.subject).toHaveValue("");
    await expect(f.subject.locator("option")).toHaveText([
      "選択してください",
      "アプリの使い方について",
      "不具合の報告",
      "機能の要望",
      "アカウント・データについて",
      "取材・掲載・提携について",
      "その他",
    ]);
    await expect(f.email).toBeVisible();
    await expect(f.message).toBeVisible();
    await expect(f.pickFiles).toBeEnabled();
    await expect(f.confirm).toBeDisabled();
    // ハニーポット欄は画面外に置かれ、利用者には見えない
    await expect(page.getByLabel("Website")).not.toBeInViewport();
    // フォームを使えない場合の直接連絡先
    await expect(
      page.getByRole("link", { name: "contact@flexqstudio.com" }),
    ).toHaveAttribute("href", "mailto:contact@flexqstudio.com");
  });

  test("CT-02 必須項目がすべて入力されたときだけ入力確認を押せる", async ({
    page,
  }) => {
    const f = form(page);
    await f.subject.selectOption(SUBJECT);
    await expect(f.confirm).toBeDisabled();
    await f.email.fill(EMAIL);
    await expect(f.confirm).toBeDisabled();
    await f.message.fill(MESSAGE);
    await expect(f.confirm).toBeEnabled();

    // 空白だけの本文は未入力扱い
    await f.message.fill("   \n  ");
    await expect(f.confirm).toBeDisabled();
    await f.message.fill(MESSAGE);
    await f.email.fill("");
    await expect(f.confirm).toBeDisabled();
  });

  test("CT-03 メールアドレスの形式が誤っていると確認画面に進まない", async ({
    page,
  }) => {
    const f = form(page);
    await fillValid(page);
    await f.email.fill("e2e-test@example");
    await f.confirm.click();

    await expect(f.alert).toHaveText(
      "メールアドレスの形式が正しくありません。",
    );
    await expect(f.email).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByRole("group", { name: "入力フォーム" }),
    ).toBeVisible();

    // 入力し直すとエラーが消える
    await f.email.fill(EMAIL);
    await expect(f.alert).toHaveCount(0);
  });

  test("CT-04 確認画面に入力内容が表示され、修正するで入力値を保ったまま戻る", async ({
    page,
  }) => {
    const f = form(page);
    await fillValid(page);
    await f.confirm.click();

    const confirm = page.getByRole("group", { name: "入力内容の確認" });
    await expect(confirm).toBeVisible();
    // ステップ切り替え時は新しい画面の先頭が表示される（SP で確認内容が画面外にならない）
    await expect(
      confirm.getByText("以下の内容で送信します。"),
    ).toBeInViewport();
    await expect(confirm.getByText(SUBJECT)).toBeVisible();
    await expect(confirm.getByText(EMAIL)).toBeVisible();
    await expect(confirm.getByText("E2E テストの本文です。")).toBeVisible();
    await expect(confirm.getByText("なし")).toBeVisible();
    // 送信ボタンは表示・活性だが、E2E では押さない
    await expect(
      confirm.getByRole("button", { name: "送信する" }),
    ).toBeEnabled();

    await confirm.getByRole("button", { name: "修正する" }).click();
    await expect(
      page.getByRole("group", { name: "入力フォーム" }),
    ).toBeVisible();
    await expect(f.subject).toHaveValue(SUBJECT);
    await expect(f.email).toHaveValue(EMAIL);
    await expect(f.message).toHaveValue(MESSAGE);
  });

  test("CT-05 本文の文字数が表示され、2000 文字で止まる", async ({ page }) => {
    const f = form(page);
    await expect(page.getByText("0 / 2000")).toBeVisible();
    await f.message.fill("あいうえお");
    await expect(page.getByText("5 / 2000")).toBeVisible();
    await expect(f.message).toHaveAttribute("maxlength", "2000");
  });

  test("CT-06 添付ファイルを追加・削除でき、確認画面にも表示される", async ({
    page,
  }) => {
    const f = form(page);
    await f.files.setInputFiles([png("screenshot.png")]);
    const item = page
      .getByRole("listitem")
      .filter({ hasText: "screenshot.png" });
    await expect(item).toBeVisible();
    await expect(item).toContainText(`${PNG_1PX.length} B`);

    await fillValid(page);
    await f.confirm.click();
    const confirm = page.getByRole("group", { name: "入力内容の確認" });
    await expect(confirm.getByText("screenshot.png")).toBeVisible();

    await confirm.getByRole("button", { name: "修正する" }).click();
    await page.getByRole("button", { name: "screenshot.png を削除" }).click();
    await expect(page.getByText("screenshot.png")).toHaveCount(0);
  });

  test("CT-07 添付ファイルの形式・サイズ・件数の制限", async ({ page }) => {
    const f = form(page);

    // 形式
    await f.files.setInputFiles([
      { name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("x") },
    ]);
    await expect(f.alert).toHaveText(
      "「note.txt」は添付できない形式です。PNG / JPG / PDF のみ添付できます。",
    );

    // 1 ファイルの上限（3 MB）
    await f.files.setInputFiles([
      png("large.png", Buffer.alloc(3 * 1024 * 1024 + 1)),
    ]);
    await expect(f.alert).toHaveText(
      "「large.png」のサイズが上限（3 MB）を超えています。",
    );

    // 件数の上限（3 件）。4 件まとめて選ぶとエラー、3 件ならボタンが押せなくなる
    await f.files.setInputFiles([
      png("1.png"),
      png("2.png"),
      png("3.png"),
      png("4.png"),
    ]);
    await expect(f.alert).toHaveText("添付できるファイルは 3 件までです。");
    await f.files.setInputFiles([png("1.png"), png("2.png"), png("3.png")]);
    await expect(f.alert).toHaveCount(0);
    await expect(f.pickFiles).toBeDisabled();
  });
});
