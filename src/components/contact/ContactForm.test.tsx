import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT_SUBJECTS } from "@/lib/contact";

jest.mock("@/app/contact/actions", () => ({
  issueContactToken: jest.fn(),
  sendContact: jest.fn(),
}));

import { issueContactToken, sendContact } from "@/app/contact/actions";

const mockedIssueToken = issueContactToken as jest.MockedFunction<
  typeof issueContactToken
>;
const mockedSendContact = sendContact as jest.MockedFunction<
  typeof sendContact
>;

const subjectField = () => screen.getByLabelText(/お問い合わせの目的/);
const emailField = () => screen.getByLabelText(/^メールアドレス/);
const messageField = () => screen.getByLabelText(/お問い合わせ内容/);
const fileInput = () =>
  screen.getByLabelText(/添付ファイル/) as HTMLInputElement;

function fillForm(email = "user@example.com") {
  fireEvent.change(subjectField(), { target: { value: CONTACT_SUBJECTS[1] } });
  fireEvent.change(emailField(), { target: { value: email } });
  fireEvent.change(messageField(), {
    target: { value: "録音が保存されません。" },
  });
}

function makeFile(name: string, type: string, size = 100) {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
}

describe("ContactForm", () => {
  beforeEach(async () => {
    mockedIssueToken.mockReset();
    mockedSendContact.mockReset();
    mockedIssueToken.mockResolvedValue("test-token");
    render(<ContactForm />);
    // 表示時のトークン取得（useEffect）が終わるのを待つ
    await waitFor(() => expect(mockedIssueToken).toHaveBeenCalledTimes(1));
  });

  it("必須 3 項目が揃うまで入力確認ボタンが非活性", () => {
    const button = screen.getByRole("button", { name: "入力確認" });
    expect(button).toBeDisabled();

    fireEvent.change(subjectField(), { target: { value: CONTACT_SUBJECTS[0] } });
    expect(button).toBeDisabled();

    fireEvent.change(messageField(), { target: { value: "本文" } });
    expect(button).toBeDisabled();

    fireEvent.change(emailField(), { target: { value: "user@example.com" } });
    expect(button).toBeEnabled();
  });

  it("ボタンラベルは太字", () => {
    expect(screen.getByRole("button", { name: "入力確認" })).toHaveClass(
      "font-bold",
    );
    expect(screen.getByRole("button", { name: "ファイルを選択" })).toHaveClass(
      "font-bold",
    );
  });

  it("メールアドレスの形式が不正なら確認画面へ進まずエラーを表示する", () => {
    fillForm("not-an-email");
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/形式が正しくありません/);
    expect(emailField()).toBeInTheDocument();
  });

  it("入力確認 → 確認画面に入力内容を表示し、修正で入力画面へ戻れる", () => {
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));

    expect(screen.getByText(CONTACT_SUBJECTS[1])).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("録音が保存されません。")).toBeInTheDocument();
    expect(screen.getByText("なし")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "修正する" }));
    expect(messageField()).toHaveValue("録音が保存されません。");
  });

  it("添付ファイルを追加・削除でき、対象外の形式はエラーになる", () => {
    const png = makeFile("shot.png", "image/png");
    fireEvent.change(fileInput(), { target: { files: [png] } });
    expect(screen.getByText("shot.png")).toBeInTheDocument();

    fireEvent.change(fileInput(), {
      target: { files: [makeFile("memo.txt", "text/plain")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/memo\.txt/);
    expect(screen.queryByText("memo.txt")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "shot.png を削除" }));
    expect(screen.queryByText("shot.png")).not.toBeInTheDocument();
  });

  it("ハニーポット欄はキーボード操作・支援技術の対象外で、初期値は空", () => {
    const honeypot = screen.getByLabelText("Website");
    expect(honeypot).toHaveValue("");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("送信成功で完了画面とトップに戻るボタンを表示し、FormData に全項目を載せる", async () => {
    mockedSendContact.mockResolvedValue({ ok: true });
    fillForm();
    const png = makeFile("shot.png", "image/png");
    fireEvent.change(fileInput(), { target: { files: [png] } });
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    await waitFor(() =>
      expect(screen.getByText("送信が完了しました")).toBeInTheDocument(),
    );
    expect(screen.getByText("user@example.com")).toBeInTheDocument();

    const formData = mockedSendContact.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("subject")).toBe(CONTACT_SUBJECTS[1]);
    expect(formData.get("email")).toBe("user@example.com");
    expect(formData.get("message")).toBe("録音が保存されません。");
    expect(formData.get("token")).toBe("test-token");
    expect(formData.get("website")).toBe("");
    expect(formData.getAll("attachments")).toEqual([png]);

    expect(screen.getByRole("link", { name: "トップに戻る" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("送信失敗でエラーを表示し、確認画面に留まる", async () => {
    mockedSendContact.mockResolvedValue({
      ok: false,
      error: "送信に失敗しました。",
    });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("送信に失敗しました。"),
    );
    expect(screen.getByRole("button", { name: "送信する" })).toBeEnabled();
  });

  it("Server Action 自体が失敗しても確認画面に留まり、再送できる", async () => {
    mockedSendContact.mockRejectedValue(new Error("network"));
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/通信に失敗しました/),
    );
    expect(screen.getByRole("button", { name: "送信する" })).toBeEnabled();
    expect(screen.getByText("録音が保存されません。")).toBeInTheDocument();
  });

  it("ステップが切り替わると、新しい画面のコンテナへフォーカスを移す", () => {
    const onStop = jest.fn();
    window.addEventListener("flexq:stop-scroll-inertia", onStop);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "入力確認" }));
    expect(screen.getByRole("group", { name: "入力内容の確認" })).toHaveFocus();
    // スクロール前に慣性の停止を依頼している
    expect(onStop).toHaveBeenCalledTimes(1);
    window.removeEventListener("flexq:stop-scroll-inertia", onStop);

    fireEvent.click(screen.getByRole("button", { name: "修正する" }));
    expect(
      screen.getByRole("group", { name: "入力フォーム" }),
    ).toHaveFocus();
  });
});
